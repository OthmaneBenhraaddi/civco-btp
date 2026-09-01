<?php

namespace App\Services;

use App\Models\User;
use App\Support\TenantRequestResolver;

class PostLoginRedirectService
{
    public function __construct(
        private readonly PermissionResolver $permissionResolver,
    ) {}

    /**
     * SPA path (with ?tenant= in local dev) for post-login navigation.
     */
    public function pathFor(User $user): string
    {
        if ($user->isSuperAdmin()) {
            return '/super-admin/overview';
        }

        $user->loadMissing('tenant');

        if ($user->client_id !== null) {
            return $this->withTenantContext('/portal', $user);
        }

        return $this->withTenantContext($this->defaultPathFor($user), $user);
    }

    /**
     * Absolute dashboard URL for tenant users (subdomain in production).
     */
    public function absoluteUrlFor(User $user): ?string
    {
        if ($user->isSuperAdmin()) {
            return null;
        }

        $user->loadMissing('tenant');

        if ($user->tenant === null) {
            return null;
        }

        $dashboardPath = $this->defaultPathFor($user);

        if (TenantRequestResolver::usesLocalQueryFallback()) {
            $scheme = (string) config('tenancy.login_scheme', 'http');
            $host = (string) config('tenancy.local_frontend_host', '127.0.0.1');
            $port = (string) config('tenancy.frontend_port', '5173');
            $portSegment = $port !== '' ? ":{$port}" : '';

            return "{$scheme}://{$host}{$portSegment}{$dashboardPath}?tenant=".urlencode($user->tenant->subdomain);
        }

        $scheme = (string) config('tenancy.login_scheme', 'http');
        $port = (string) config('tenancy.login_port', '8000');
        $baseDomain = (string) config('tenancy.base_domain', 'monerp.com');
        $portSegment = $port !== '' ? ":{$port}" : '';
        $subdomain = $user->tenant->subdomain;

        return "{$scheme}://{$subdomain}.{$baseDomain}{$portSegment}{$dashboardPath}";
    }

    private function defaultPathFor(User $user): string
    {
        if ($user->role === 'admin') {
            return '/dashboard';
        }

        $company = $user->tenant_id !== null
            ? $user->companies()->orderByDesc('company_user.is_primary')->first()
            : $user->primaryCompany();

        if ($company === null) {
            return '/dashboard';
        }

        $permissions = $this->permissionResolver->expand(
            $user->permissionSlugsForCompany($company->id),
        );

        foreach ([
            'project.view' => '/projects',
            'invoice.view' => '/invoices',
            'quote.view' => '/quotes',
            'client.view' => '/clients',
            'dashboard.view' => '/dashboard',
        ] as $permission => $path) {
            if (in_array($permission, $permissions, true)) {
                return $path;
            }
        }

        return '/dashboard';
    }

    private function withTenantContext(string $path, User $user): string
    {
        if (TenantRequestResolver::usesLocalQueryFallback() && $user->tenant?->subdomain) {
            return $path.'?tenant='.urlencode($user->tenant->subdomain);
        }

        return $path;
    }
}
