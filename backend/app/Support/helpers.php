<?php

use App\Models\Tenant;
use App\Support\TenantManager;

if (! function_exists('current_tenant')) {
    /**
     * Resolve the tenant identified for the current HTTP request.
     */
    function current_tenant(): ?Tenant
    {
        if (app()->bound('current_tenant')) {
            $tenant = app('current_tenant');

            return $tenant instanceof Tenant ? $tenant : null;
        }

        return TenantManager::current();
    }
}
