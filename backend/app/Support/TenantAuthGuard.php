<?php

namespace App\Support;

use App\Http\Middleware\IdentifyTenantBySubdomain;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class TenantAuthGuard
{
    /**
     * Enforce tenant alignment during login when ?tenant= / X-Tenant is present.
     *
     * @throws ValidationException
     */
    public static function assertLoginMatchesTenant(Request $request, User $user): void
    {
        if (! TenantRequestResolver::shouldResolveFromRequest($request)) {
            return;
        }

        $tenant = TenantRequestResolver::resolveActiveTenant($request);

        if ($tenant === null) {
            throw ValidationException::withMessages([
                'email' => [IdentifyTenantBySubdomain::NOT_FOUND_MESSAGE],
            ]);
        }

        if ($user->tenant_id === null) {
            throw ValidationException::withMessages([
                'email' => ['Ce compte super administrateur doit utiliser la connexion globale (sans paramètre tenant).'],
            ]);
        }

        if ($user->tenant_id !== $tenant->id) {
            throw ValidationException::withMessages([
                'email' => ['Ce compte n\'appartient pas à cette entité.'],
            ]);
        }
    }

    /**
     * Block cross-tenant and super-admin access on tenant-scoped API requests.
     */
    public static function guardAuthenticatedUser(Request $request, int $tenantId): void
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return;
        }

        if ($user->tenant_id === null) {
            if (self::allowsSuperAdminTenantBypass($request)) {
                return;
            }

            throw new AccessDeniedHttpException(
                'Les super administrateurs ne peuvent pas accéder à une entité via son contexte tenant.'
            );
        }

        if ($user->tenant_id !== $tenantId) {
            throw new AccessDeniedHttpException('Vous n\'avez pas accès à cette entité.');
        }
    }

    /**
     * Super admins manage the platform globally; these routes must work even if X-Tenant is set.
     */
    private static function allowsSuperAdminTenantBypass(Request $request): bool
    {
        return $request->is('api/v1/super-admin')
            || $request->is('api/v1/super-admin/*')
            || $request->is('api/v1/team')
            || $request->is('api/v1/team/*');
    }
}
