<?php

namespace App\Support;

use Illuminate\Http\Request;

final class TenantLoginUrl
{
    public static function forSubdomain(string $subdomain): string
    {
        if (TenantRequestResolver::usesLocalQueryFallback()) {
            return self::localBackendLoginUrl($subdomain);
        }

        $scheme = (string) config('tenancy.login_scheme', 'http');
        $port = (string) config('tenancy.login_port', '8000');
        $baseDomain = (string) config('tenancy.base_domain', 'monerp.com');
        $portSegment = $port !== '' ? ":{$port}" : '';

        return "{$scheme}://{$subdomain}.{$baseDomain}{$portSegment}/login";
    }

    public static function localBackendLoginUrl(string $subdomain): string
    {
        $scheme = (string) config('tenancy.login_scheme', 'http');
        $host = (string) config('tenancy.local_login_host', 'localhost');
        $port = (string) config('tenancy.login_port', '8000');
        $portSegment = $port !== '' ? ":{$port}" : '';

        return "{$scheme}://{$host}{$portSegment}/login?tenant=".urlencode($subdomain);
    }

    public static function localFrontendLoginUrl(string $subdomain): string
    {
        $scheme = (string) config('tenancy.login_scheme', 'http');
        $host = (string) config('tenancy.local_frontend_host', '127.0.0.1');
        $port = (string) config('tenancy.frontend_port', '5173');
        $portSegment = $port !== '' ? ":{$port}" : '';

        return "{$scheme}://{$host}{$portSegment}/login?tenant=".urlencode($subdomain);
    }

    public static function localFrontendHomeUrl(?string $subdomain = null): string
    {
        $scheme = (string) config('tenancy.login_scheme', 'http');
        $host = (string) config('tenancy.local_frontend_host', '127.0.0.1');
        $port = (string) config('tenancy.frontend_port', '5173');
        $portSegment = $port !== '' ? ":{$port}" : '';
        $query = $subdomain ? '?tenant='.urlencode($subdomain) : '';

        return "{$scheme}://{$host}{$portSegment}/{$query}";
    }

    public static function bareHostRedirect(Request $request): string
    {
        $tenantKey = TenantRequestResolver::extractTenantKey($request);

        if ($tenantKey !== null && TenantRequestResolver::usesLocalQueryFallback()) {
            return self::localFrontendLoginUrl($tenantKey);
        }

        $scheme = (string) config('tenancy.login_scheme', 'http');
        $frontendPort = (string) config('tenancy.frontend_port', '5173');
        $portSegment = $frontendPort !== '' ? ":{$frontendPort}" : '';
        $host = self::resolveBareFrontendHost($request->getHost());
        $path = self::resolveBareHostPath($request);

        return "{$scheme}://{$host}{$portSegment}{$path}";
    }

    /** Guest/marketing home on the Vite SPA (not /login). */
    public static function bareHostHomeRedirect(Request $request): string
    {
        $tenantKey = TenantRequestResolver::extractTenantKey($request);

        if ($tenantKey !== null && TenantRequestResolver::usesLocalQueryFallback()) {
            return self::localFrontendHomeUrl($tenantKey);
        }

        $scheme = (string) config('tenancy.login_scheme', 'http');
        $frontendPort = (string) config('tenancy.frontend_port', '5173');
        $portSegment = $frontendPort !== '' ? ":{$frontendPort}" : '';
        $host = self::resolveBareFrontendHost($request->getHost());

        $user = $request->user();
        if ($user !== null && $user->isSuperAdmin()) {
            return "{$scheme}://{$host}{$portSegment}".(string) config('tenancy.super_admin_path', '/super-admin');
        }

        return "{$scheme}://{$host}{$portSegment}/";
    }

    public static function tenantFrontendLogin(Request $request): string
    {
        $tenantKey = TenantRequestResolver::extractTenantKey($request);

        if ($tenantKey !== null && TenantRequestResolver::usesLocalQueryFallback()) {
            return self::localFrontendLoginUrl($tenantKey);
        }

        $scheme = (string) config('tenancy.login_scheme', 'http');
        $frontendPort = (string) config('tenancy.frontend_port', '5173');
        $portSegment = $frontendPort !== '' ? ":{$frontendPort}" : '';
        $host = strtolower($request->getHost());

        return "{$scheme}://{$host}{$portSegment}/login";
    }

    public static function isBareLocalHost(string $host): bool
    {
        $normalized = strtolower(preg_replace('/:\d+$/', '', $host) ?? $host);

        return in_array($normalized, config('tenancy.local_hosts', ['localhost', '127.0.0.1']), true);
    }

    public static function isBaseDomainOnly(string $host): bool
    {
        $normalized = strtolower(preg_replace('/^www\./', '', $host) ?? $host);
        $baseDomain = strtolower((string) config('tenancy.base_domain', 'monerp.com'));

        return $normalized === $baseDomain;
    }

    private static function resolveBareFrontendHost(string $host): string
    {
        return self::isBareLocalHost($host)
            ? (string) config('tenancy.local_frontend_host', '127.0.0.1')
            : strtolower($host);
    }

    private static function resolveBareHostPath(Request $request): string
    {
        $user = $request->user();

        if ($user !== null && $user->isSuperAdmin()) {
            return (string) config('tenancy.super_admin_path', '/super-admin');
        }

        return (string) config('tenancy.fallback_path', '/login');
    }
}
