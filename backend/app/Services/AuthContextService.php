<?php

namespace App\Services;

use App\Models\Company;
use App\Models\User;

class AuthContextService
{
    public function forUser(User $user, ?int $companyId = null): array
    {
        $company = $this->resolveCompany($user, $companyId);

        $roles = $company
            ? $user->rolesForCompany($company->id)->get(['roles.id', 'roles.name', 'roles.slug'])
            : collect();

        $permissions = $company
            ? $user->permissionSlugsForCompany($company->id)
            : [];

        return [
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role ?? 'user',
            ],
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
                'visibility' => $company->visibility->value,
            ] : null,
            'companies' => $user->companies()->get(['companies.id', 'companies.name'])->map(fn (Company $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'is_primary' => (bool) $c->pivot->is_primary,
            ])->values()->all(),
            'roles' => $roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values()->all(),
            'permissions' => $permissions,
        ];
    }

    private function resolveCompany(User $user, ?int $companyId): ?Company
    {
        if ($companyId !== null) {
            return $user->companies()->where('companies.id', $companyId)->first();
        }

        return $user->primaryCompany();
    }
}
