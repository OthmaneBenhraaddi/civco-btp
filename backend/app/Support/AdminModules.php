<?php

namespace App\Support;

use App\Models\User;

final class AdminModules
{
    public const CHANTIER = 'chantier';

    public const COMMERCIAL = 'commercial';

    public const SUPPORT = 'support';

    /** @return list<string> */
    public static function keys(): array
    {
        return [self::CHANTIER, self::COMMERCIAL, self::SUPPORT];
    }

    /**
     * First URL segment under /api/v1 mapped to a module.
     *
     * @return array<string, string>
     */
    public static function apiSegmentMap(): array
    {
        return [
            'projects' => self::CHANTIER,
            'phases' => self::CHANTIER,
            'tasks' => self::CHANTIER,
            'documents' => self::CHANTIER,
            'expenses' => self::CHANTIER,
            'amendments' => self::CHANTIER,
            'clients' => self::COMMERCIAL,
            'quotes' => self::COMMERCIAL,
            'quote-lines' => self::COMMERCIAL,
            'invoices' => self::COMMERCIAL,
            'invoice-lines' => self::COMMERCIAL,
            'payments' => self::COMMERCIAL,
            'delivery-forms' => self::COMMERCIAL,
            'dispatch-notes' => self::COMMERCIAL,
            'tickets' => self::SUPPORT,
            'messaging' => self::SUPPORT,
        ];
    }

    public static function moduleForApiPath(string $path): ?string
    {
        $relative = preg_replace('#^api/v1/#', '', trim($path, '/')) ?? '';
        $segment = explode('/', $relative)[0] ?? '';

        return self::apiSegmentMap()[$segment] ?? null;
    }

    public static function allows(User $user, string $module): bool
    {
        if (! $user->isAdmin() || $user->isSuperAdmin() || $user->tenant_id === null) {
            return true;
        }

        $enabled = $user->enabled_modules;

        if ($enabled === null) {
            return true;
        }

        return in_array($module, $enabled, true);
    }
}
