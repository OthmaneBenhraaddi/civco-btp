<?php

namespace App\Support;

use App\Enums\TenantStatus;
use App\Models\Tenant;
use App\Http\Middleware\IdentifyTenantBySubdomain;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class TenantRequestResolver
{
    public const HEADER = 'X-Tenant';

    public const QUERY_PARAM = 'tenant';

    public static function usesLocalQueryFallback(): bool
    {
        return app()->environment('local')
            && (bool) config('tenancy.local_query_fallback', true);
    }

    public static function extractTenantKey(Request $request): ?string
    {
        $value = $request->header(self::HEADER) ?? $request->query(self::QUERY_PARAM);

        if (! is_string($value)) {
            return null;
        }

        return self::normalizeSubdomain($value);
    }

    public static function shouldResolveFromRequest(Request $request): bool
    {
        return self::usesLocalQueryFallback()
            && TenantLoginUrl::isBareLocalHost($request->getHost())
            && self::extractTenantKey($request) !== null;
    }

    public static function resolveActiveTenant(Request $request): ?Tenant
    {
        $key = self::extractTenantKey($request);

        if ($key === null) {
            return null;
        }

        return Tenant::query()
            ->where('subdomain', $key)
            ->where('status', TenantStatus::Active)
            ->first();
    }

    public static function handleLocalFallback(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Tenant users always operate in their own entity context — ignore stale ?tenant= / X-Tenant.
        if ($user?->tenant_id !== null) {
            $tenant = Tenant::query()->find($user->tenant_id);

            if ($tenant !== null) {
                self::bindTenant($request, $tenant);

                return $next($request);
            }
        }

        if (! self::shouldResolveFromRequest($request)) {
            return $next($request);
        }

        $tenant = self::resolveActiveTenant($request);

        if ($tenant === null) {
            abort(404, IdentifyTenantBySubdomain::NOT_FOUND_MESSAGE);
        }

        self::bindTenant($request, $tenant);
        TenantAuthGuard::guardAuthenticatedUser($request, $tenant->id);

        return $next($request);
    }

    public static function bindTenant(Request $request, Tenant $tenant): void
    {
        TenantManager::setTenant($tenant);

        app()->instance('current_tenant', $tenant);

        $request->attributes->set('tenant', $tenant);
        $request->attributes->set('tenant_id', $tenant->id);
    }

    public static function guardUserTenantAccess(Request $request, Tenant $tenant): void
    {
        TenantAuthGuard::guardAuthenticatedUser($request, $tenant->id);
    }

    private static function normalizeSubdomain(string $subdomain): ?string
    {
        $normalized = strtolower(trim($subdomain));

        if ($normalized === '') {
            return null;
        }

        if (in_array($normalized, config('tenancy.ignored_subdomains', []), true)) {
            return null;
        }

        return $normalized;
    }
}
