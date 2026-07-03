<?php

namespace App\Support;

use App\Models\User;

final class ProvisionedCredentialPolicy
{
    /**
     * Only platform super admins may view provisioned / stored passwords.
     */
    public static function canRevealToViewer(?User $viewer): bool
    {
        return $viewer !== null && $viewer->isSuperAdmin();
    }
}
