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
    /** @var list<string> */
    private const NON_ASSIGNABLE_ROLE_SLUGS = ['super_admin', 'client_extern'];

    public function __construct(
        private readonly AdminCredentialService $adminCredentialService,
    ) {}

    public function createForCompany(
        int $companyId,
        int $tenantId,
        string $firstName,
        string $lastName,
        string $email,
        string $password,
        int $roleId,
        ?string $cin = null,
        ?string $phone = null,
        ?string $jobTitle = null,
    ): User {
        $role = Role::query()
            ->where('id', $roleId)
            ->where(function ($builder) use ($companyId): void {
                $builder->whereNull('company_id')
                    ->orWhere('company_id', $companyId);
            })
            ->first();

        if ($role === null) {
            throw new InvalidArgumentException('Rôle invalide ou inaccessible pour cette société.');
        }

        if (in_array($role->slug, self::NON_ASSIGNABLE_ROLE_SLUGS, true)) {
            throw new InvalidArgumentException('Ce rôle ne peut pas être assigné à un membre d\'équipe.');
        }

        return DB::transaction(function () use (
            $companyId,
            $tenantId,
            $firstName,
            $lastName,
            $email,
            $password,
            $role,
            $cin,
            $phone,
            $jobTitle,
        ): User {
            $resolvedJobTitle = $jobTitle ?: $role->name;

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
                'role' => $role->slug === 'admin' ? 'admin' : 'user',
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

    public function updateRoleForCompany(User $member, int $companyId, int $roleId): User
    {
        $role = Role::query()
            ->where('id', $roleId)
            ->where(function ($builder) use ($companyId): void {
                $builder->whereNull('company_id')
                    ->orWhere('company_id', $companyId);
            })
            ->first();

        if ($role === null) {
            throw new InvalidArgumentException('Rôle invalide ou inaccessible pour cette société.');
        }

        if (in_array($role->slug, self::NON_ASSIGNABLE_ROLE_SLUGS, true)) {
            throw new InvalidArgumentException('Ce rôle ne peut pas être assigné à un membre d\'équipe.');
        }

        return DB::transaction(function () use ($member, $companyId, $role): User {
            $previousRoleName = $member->roles()
                ->wherePivot('company_id', $companyId)
                ->value('roles.name');

            $member->roles()->sync([
                $role->id => ['company_id' => $companyId],
            ]);

            $updates = [
                'role' => $role->slug === 'admin' ? 'admin' : 'user',
            ];

            if ($previousRoleName !== null
                && trim((string) $member->job_title) === trim((string) $previousRoleName)) {
                $updates['job_title'] = $role->name;
            }

            $member->update($updates);

            return $member->fresh()->load(['companies', 'roles', 'tenant:id,name,subdomain']);
        });
    }
}
