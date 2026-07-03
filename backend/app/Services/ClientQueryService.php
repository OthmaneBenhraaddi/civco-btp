<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ClientQueryService
{
    /**
     * Resolve tenant scope for client listing.
     * Super admins may pass ?tenant_id= or ?tenant={subdomain}; tenant users are locked to their tenant.
     */
    public function resolveTenantScope(Request $request, User $actor): ?int
    {
        if ($actor->isSuperAdmin()) {
            return $this->resolveRequestedTenantId($request);
        }

        if ($request->filled('tenant_id')
            && $request->integer('tenant_id') !== (int) $actor->tenant_id) {
            throw new AccessDeniedHttpException('Vous ne pouvez pas consulter les clients d\'une autre entité.');
        }

        if ($request->filled('tenant')) {
            $requested = $this->resolveTenantIdFromSubdomain($request->string('tenant')->toString());

            if ($requested !== null && $requested !== (int) $actor->tenant_id) {
                throw new AccessDeniedHttpException('Vous ne pouvez pas consulter les clients d\'une autre entité.');
            }
        }

        return $actor->tenant_id !== null ? (int) $actor->tenant_id : null;
    }

    public function assertCanManageClient(User $actor, ?int $clientTenantId): void
    {
        if ($actor->isSuperAdmin()) {
            return;
        }

        if (! $actor->isAdmin()) {
            throw new AccessDeniedHttpException('Action réservée aux administrateurs.');
        }

        if ($clientTenantId !== null && (int) $clientTenantId !== (int) $actor->tenant_id) {
            throw new AccessDeniedHttpException('Vous ne pouvez gérer que les clients de votre entité.');
        }
    }

    private function resolveRequestedTenantId(Request $request): ?int
    {
        if ($request->filled('tenant_id')) {
            return $request->integer('tenant_id');
        }

        if ($request->filled('tenant')) {
            return $this->resolveTenantIdFromSubdomain($request->string('tenant')->toString());
        }

        return null;
    }

    private function resolveTenantIdFromSubdomain(string $subdomain): ?int
    {
        $normalized = strtolower(trim($subdomain));

        if ($normalized === '') {
            return null;
        }

        return Tenant::query()
            ->where('subdomain', $normalized)
            ->value('id');
    }
}
