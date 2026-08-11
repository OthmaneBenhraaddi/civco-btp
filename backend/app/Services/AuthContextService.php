<?php

namespace App\Services;

use App\Models\Company;
use App\Models\User;
use App\Support\TenantLogoStorage;

class AuthContextService
{
    public function __construct(
        private readonly PostLoginRedirectService $postLoginRedirect,
        private readonly PermissionResolver $permissionResolver,
    ) {}

    public function forUser(User $user, ?int $companyId = null): array
    {
        $user->loadMissing('tenant');

        $company = $this->resolveCompany($user, $companyId);

        $roles = $company
            ? $user->rolesForCompany($company->id)->get(['roles.id', 'roles.name', 'roles.slug'])
            : collect();

        $permissions = $company
            ? $this->permissionResolver->expand($user->permissionSlugsForCompany($company->id))
            : [];

        $primaryRole = $roles->first();

        return [
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role ?? 'user',
                'job_title' => $primaryRole?->name,
                'client_id' => $user->client_id,
                'tenant_id' => $user->tenant_id,
                'is_super_admin' => $user->isSuperAdmin(),
                'stealth_shortcut' => $user->stealth_shortcut,
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
            'tenant' => $user->tenant ? [
                'id' => $user->tenant->id,
                'name' => $user->tenant->name,
                'subdomain' => $user->tenant->subdomain,
                'logo_url' => TenantLogoStorage::url($user->tenant->logo_path),
            ] : null,
            'redirect_to' => $this->postLoginRedirect->pathFor($user),
            'redirect_url' => $this->postLoginRedirect->absoluteUrlFor($user),
        ];
    }

    private function resolveCompany(User $user, ?int $companyId): ?Company
    {
        if ($companyId !== null) {
            return $user->companies()->where('companies.id', $companyId)->first();
        }

        if ($user->tenant_id !== null) {
            return $user->companies()
                ->orderByDesc('company_user.is_primary')
                ->first();
        }

        return $user->primaryCompany();
    }
}
