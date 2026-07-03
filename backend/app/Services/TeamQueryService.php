<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class TeamQueryService
{
    /**
     * Resolve tenant scope for team listing.
     * Super admins may pass ?tenant_id=; entity admins are locked to their tenant.
     */
    public function resolveTenantScope(Request $request, User $actor): ?int
    {
        if ($actor->isSuperAdmin()) {
            return $request->filled('tenant_id')
                ? $request->integer('tenant_id')
                : null;
        }

        if ($request->filled('tenant_id')
            && $request->integer('tenant_id') !== (int) $actor->tenant_id) {
            throw new AccessDeniedHttpException('Vous ne pouvez pas consulter l\'équipe d\'une autre entité.');
        }

        return $actor->tenant_id !== null ? (int) $actor->tenant_id : null;
    }

    public function assertCanManageMember(User $actor, User $member): void
    {
        if ($member->client_id !== null) {
            throw new AccessDeniedHttpException('Les utilisateurs portail client ne sont pas gérés ici.');
        }

        if ($member->tenant_id === null) {
            throw new AccessDeniedHttpException('Les comptes super administrateur ne peuvent pas être gérés depuis cette vue.');
        }

        if ($actor->isSuperAdmin()) {
            return;
        }

        if (! $actor->isAdmin()) {
            throw new AccessDeniedHttpException('Action réservée aux administrateurs.');
        }

        if ((int) $member->tenant_id !== (int) $actor->tenant_id) {
            throw new AccessDeniedHttpException('Vous ne pouvez gérer que les membres de votre entité.');
        }
    }

    public function assertCanToggleMemberStatus(User $actor, User $member): void
    {
        $this->assertCanManageMember($actor, $member);

        if ($actor->id === $member->id) {
            throw new AccessDeniedHttpException('Vous ne pouvez pas modifier votre propre accès.');
        }

        if ($member->isAdmin() && ! $actor->isSuperAdmin()) {
            throw new AccessDeniedHttpException('Seul le super administrateur peut modifier l\'accès d\'un administrateur d\'entité.');
        }
    }
}
