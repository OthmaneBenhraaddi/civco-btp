<?php

namespace App\Support;

use App\Models\Tenant;
use App\Models\User;

/**
 * Resolves the active tenant for HTTP requests, jobs, and CLI/seed contexts.
 *
 * Resolution order:
 * 1. Tenant bound by IdentifyTenantBySubdomain middleware (subdomain routing)
 * 2. Explicit ID set via setTenantId() / setTenant() (jobs, seeders)
 * 3. Authenticated user's tenant_id (null for super admins)
 *
 * When no tenant can be resolved, global scopes are not applied so seeds and
 * super admins can operate across tenants.
 */
final class TenantManager
{
    private static ?Tenant $tenant = null;

    private static ?int $tenantId = null;

    private static bool $scopeBypassed = false;

    public static function setTenant(Tenant $tenant): void
    {
        self::$tenant = $tenant;
        self::$tenantId = $tenant->id;
    }

    public static function setTenantId(?int $tenantId): void
    {
        self::$tenantId = $tenantId;
        self::$tenant = null;
    }

    public static function current(): ?Tenant
    {
        if (self::$tenant !== null) {
            return self::$tenant;
        }

        $tenantId = self::currentId();

        if ($tenantId === null) {
            return null;
        }

        return Tenant::query()->find($tenantId);
    }

    public static function bypassScope(bool $bypass = true): void
    {
        self::$scopeBypassed = $bypass;
    }

    public static function currentId(): ?int
    {
        if (self::$tenantId !== null) {
            return self::$tenantId;
        }

        $user = auth()->user();

        if ($user instanceof User && $user->tenant_id !== null) {
            return (int) $user->tenant_id;
        }

        return null;
    }

    public static function shouldApplyScope(): bool
    {
        if (self::$scopeBypassed) {
            return false;
        }

        return self::currentId() !== null;
    }

    public static function reset(): void
    {
        self::$tenant = null;
        self::$tenantId = null;
        self::$scopeBypassed = false;
    }
}
