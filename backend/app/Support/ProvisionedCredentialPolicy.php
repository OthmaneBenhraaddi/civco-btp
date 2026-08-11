<?php

namespace App\Support;

use App\Models\User;

final class ProvisionedCredentialPolicy
{
    /**
     * Platform super admins and tenant entity admins may view team-member passwords.
     */
    public static function canRevealToViewer(?User $viewer): bool
    {
        if ($viewer === null) {
            return false;
        }

        if ($viewer->isSuperAdmin()) {
            return true;
        }

        return $viewer->isAdmin() && $viewer->tenant_id !== null;
    }

    /**
     * Client portal credentials: super admin or admin of the client's tenant.
     */
    public static function canRevealClientPortalCredentials(?User $viewer, ?int $clientTenantId): bool
    {
        if ($viewer === null || $clientTenantId === null) {
            return false;
        }

        if ($viewer->isSuperAdmin()) {
            return true;
        }

        return $viewer->isAdmin()
            && $viewer->tenant_id !== null
            && (int) $viewer->tenant_id === $clientTenantId;
    }

    /**
     * Team member credentials: super admin or admin of the member's tenant.
     */
    public static function canRevealTeamMemberCredentials(?User $viewer, ?int $memberTenantId): bool
    {
        if ($viewer === null || $memberTenantId === null) {
            return false;
        }

        if ($viewer->isSuperAdmin()) {
            return true;
        }

        return $viewer->isAdmin()
            && $viewer->tenant_id !== null
            && (int) $viewer->tenant_id === $memberTenantId;
    }
}
