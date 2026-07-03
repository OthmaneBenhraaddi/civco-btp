<?php

namespace App\Services;

use App\Enums\UserStatus;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;

class TeamMemberService
{
    public function __construct(
        private readonly AdminCredentialService $adminCredentialService,
    ) {}

    /** @var array<string, string> */
    private const ROLE_SLUG_MAP = [
        'admin' => 'admin',
        'technicien' => 'collaborator',
        'comptable' => 'accountant',
    ];

    public function createForCompany(
        int $companyId,
        int $tenantId,
        string $firstName,
        string $lastName,
        string $email,
        string $password,
        string $teamRole,
        ?string $cin = null,
        ?string $phone = null,
        ?string $jobTitle = null,
    ): User {
        $roleSlug = self::ROLE_SLUG_MAP[$teamRole] ?? null;

        if ($roleSlug === null) {
            throw new InvalidArgumentException('Rôle d\'équipe invalide.');
        }

        $role = Role::query()
            ->whereNull('company_id')
            ->where('slug', $roleSlug)
            ->first();

        if ($role === null) {
            throw new InvalidArgumentException('Rôle système introuvable.');
        }

        return DB::transaction(function () use (
            $companyId,
            $tenantId,
            $firstName,
            $lastName,
            $email,
            $password,
            $teamRole,
            $role,
            $cin,
            $phone,
            $jobTitle,
        ): User {
            $resolvedJobTitle = $jobTitle ?: $this->defaultJobTitleForRole($teamRole);

            $user = User::query()->create([
                'tenant_id' => $tenantId,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'cin' => $cin,
                'phone' => $phone,
                'email' => $email,
                'password' => Hash::make($password),
                'is_active' => true,
                'status' => UserStatus::Active,
                'role' => $teamRole === 'admin' ? 'admin' : 'user',
                'job_title' => $resolvedJobTitle,
                'email_verified_at' => now(),
            ]);

            $this->adminCredentialService->storeProvisionedPassword($user, $password);

            $user->companies()->attach($companyId, [
                'is_primary' => true,
                'joined_at' => now()->toDateString(),
            ]);

            $user->roles()->sync([
                $role->id => ['company_id' => $companyId],
            ]);

            return $user->load(['companies', 'roles', 'tenant']);
        });
    }

    private function defaultJobTitleForRole(string $teamRole): string
    {
        return match ($teamRole) {
            'admin' => 'Administrateur',
            'comptable' => 'Comptable',
            default => 'Technicien',
        };
    }
}
