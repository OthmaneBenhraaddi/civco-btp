<?php

namespace App\Services;

use App\Models\User;
use App\Support\TenantLoginUrl;
use App\Support\TenantRequestResolver;

class PostLoginRedirectService
{
    /**
     * SPA path (with ?tenant= in local dev) for post-login navigation.
     */
    public function pathFor(User $user): string
    {
        if ($user->isSuperAdmin()) {
            return '/super-admin';
        }

        $user->loadMissing('tenant');

        if ($user->client_id !== null) {
            return $this->withTenantContext('/portal', $user);
        }

        $path = $user->role === 'admin' ? '/' : '/projects';

        return $this->withTenantContext($path, $user);
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

        if (TenantRequestResolver::usesLocalQueryFallback()) {
            $scheme = (string) config('tenancy.login_scheme', 'http');
            $host = (string) config('tenancy.local_frontend_host', '127.0.0.1');
            $port = (string) config('tenancy.frontend_port', '5173');
            $portSegment = $port !== '' ? ":{$port}" : '';
            $path = $user->role === 'admin' ? '/' : '/projects';

            return "{$scheme}://{$host}{$portSegment}{$path}?tenant=".urlencode($user->tenant->subdomain);
        }

        $scheme = (string) config('tenancy.login_scheme', 'http');
        $port = (string) config('tenancy.login_port', '8000');
        $baseDomain = (string) config('tenancy.base_domain', 'monerp.com');
        $portSegment = $port !== '' ? ":{$port}" : '';
        $subdomain = $user->tenant->subdomain;
        $dashboardPath = $user->role === 'admin' ? '/' : '/projects';

        return "{$scheme}://{$subdomain}.{$baseDomain}{$portSegment}{$dashboardPath}";
    }

    private function withTenantContext(string $path, User $user): string
    {
        if (TenantRequestResolver::usesLocalQueryFallback() && $user->tenant?->subdomain) {
            return $path.'?tenant='.urlencode($user->tenant->subdomain);
        }

        return $path;
    }
}
