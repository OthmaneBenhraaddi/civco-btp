<?php

namespace App\Http\Middleware;

use App\Enums\TenantStatus;
use App\Models\Tenant;
use App\Support\TenantLoginUrl;
use App\Support\TenantRequestResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenantBySubdomain
{
    public const NOT_FOUND_MESSAGE = 'Cette entité n\'existe pas ou est inactive.';

    public function handle(Request $request, Closure $next): Response
    {
        if (TenantRequestResolver::shouldResolveFromRequest($request)) {
            return TenantRequestResolver::handleLocalFallback($request, $next);
        }

        $subdomain = $this->resolveSubdomain($request);

        if ($subdomain === null) {
            return $this->handleMissingSubdomain($request, $next);
        }

        $tenant = Tenant::query()
            ->where('subdomain', $subdomain)
            ->where('status', TenantStatus::Active)
            ->first();

        if ($tenant === null) {
            abort(404, self::NOT_FOUND_MESSAGE);
        }

        TenantRequestResolver::bindTenant($request, $tenant);
        TenantRequestResolver::guardUserTenantAccess($request, $tenant);

        return $next($request);
    }

    private function handleMissingSubdomain(Request $request, Closure $next): Response
    {
        if (TenantLoginUrl::isBareLocalHost($request->getHost())) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return $next($request);
            }

            // `/` and other entry paths → SPA home; `/login` still goes to SPA login.
            if ($request->is('/')) {
                return redirect()->away(TenantLoginUrl::bareHostHomeRedirect($request));
            }

            return redirect()->away(TenantLoginUrl::bareHostRedirect($request));
        }

        if (TenantLoginUrl::isBaseDomainOnly($request->getHost())) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Accédez à votre entité via son sous-domaine (ex. civco.monerp.com).',
                ], 404);
            }

            if ($request->is('/')) {
                return redirect()->away(TenantLoginUrl::bareHostHomeRedirect($request));
            }

            return redirect()->away(TenantLoginUrl::bareHostRedirect($request));
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            abort(404, self::NOT_FOUND_MESSAGE);
        }

        return redirect()->away(TenantLoginUrl::bareHostRedirect($request));
    }

    private function resolveSubdomain(Request $request): ?string
    {
        $routeSubdomain = $request->route('subdomain');

        if (is_string($routeSubdomain) && $routeSubdomain !== '') {
            return $this->normalizeSubdomain($routeSubdomain);
        }

        return $this->extractSubdomainFromHost($request->getHost());
    }

    private function extractSubdomainFromHost(string $host): ?string
    {
        $host = strtolower($host);
        $host = preg_replace('/^www\./', '', $host) ?? $host;

        $baseDomain = strtolower((string) config('tenancy.base_domain'));

        if ($host === $baseDomain || TenantLoginUrl::isBareLocalHost($host)) {
            return null;
        }

        $suffix = '.'.$baseDomain;

        if (! str_ends_with($host, $suffix)) {
            return null;
        }

        $prefix = substr($host, 0, -strlen($suffix));
        $label = explode('.', $prefix)[0] ?? '';

        return $this->normalizeSubdomain($label);
    }

    private function normalizeSubdomain(string $subdomain): ?string
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
