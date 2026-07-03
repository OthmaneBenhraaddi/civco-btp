<?php

namespace App\Http\Middleware;

use App\Support\TenantRequestResolver;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves tenant context on localhost via ?tenant=slug or X-Tenant header (local dev only).
 */
class ResolveLocalTenantFallback
{
    public function handle(Request $request, Closure $next): Response
    {
        return TenantRequestResolver::handleLocalFallback($request, $next);
    }
}
