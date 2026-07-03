<?php

namespace App\Services;

use App\Enums\UserStatus;
use App\Models\Client;
use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;

class ClientPortalProvisioningService
{
    public function __construct(
        private readonly AdminCredentialService $credentialService,
    ) {}

    public function ensurePortalUser(Client $client, Company $company): User
    {
        if ($client->email === null || trim($client->email) === '') {
            throw new InvalidArgumentException('Un e-mail client est requis pour activer le portail.');
        }

        $existing = $client->portalUser;

        if ($existing !== null) {
            return $existing;
        }

        $plainPassword = Str::password(12);

        return DB::transaction(function () use ($client, $company, $plainPassword): User {
            $firstName = $this->resolveFirstName($client);
            $lastName = $this->resolveLastName($client);

            if ($firstName === '' || $lastName === '') {
                throw new InvalidArgumentException(
                    'Le client doit avoir un nom complet (prénom et nom) pour activer le portail.',
                );
            }

            $user = User::query()->create([
                'tenant_id' => $client->tenant_id,
                'client_id' => $client->id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $client->email,
                'phone' => $client->phone,
                'password' => Hash::make($plainPassword),
                'is_active' => true,
                'status' => UserStatus::Active,
                'role' => 'user',
                'email_verified_at' => now(),
            ]);

            $company->users()->syncWithoutDetaching([
                $user->id => [
                    'is_primary' => true,
                    'joined_at' => now()->toDateString(),
                ],
            ]);

            $clientRole = Role::query()
                ->whereNull('company_id')
                ->where('slug', 'client_extern')
                ->first();

            if ($clientRole !== null) {
                $user->roles()->syncWithoutDetaching([
                    $clientRole->id => ['company_id' => $company->id],
                ]);
            }

            $this->credentialService->storeProvisionedPassword($user, $plainPassword);

            return $user->fresh();
        });
    }

    public function setPortalActive(Client $client, Company $company, bool $active): User
    {
        $user = $client->portalUser;

        if ($user === null) {
            if (! $active) {
                throw new InvalidArgumentException('Aucun compte portail n\'existe pour ce client.');
            }

            return $this->ensurePortalUser($client, $company);
        }

        $user->update([
            'is_active' => $active,
            'status' => $active ? UserStatus::Active : UserStatus::Inactive,
        ]);

        return $user->fresh();
    }

    private function resolveFirstName(Client $client): string
    {
        $source = $client->contact_name ?: $client->name;
        $parts = preg_split('/\s+/', trim((string) $source), 2) ?: [];

        return trim($parts[0] ?? '');
    }

    private function resolveLastName(Client $client): string
    {
        $source = $client->contact_name ?: $client->name;
        $parts = preg_split('/\s+/', trim((string) $source), 2) ?: [];

        if (isset($parts[1])) {
            return trim($parts[1]);
        }

        return trim((string) $client->name);
    }
}
