<?php

namespace App\Support;

use App\Models\Tenant;

final class TenantPrintPolicy
{
    public static function maxOfficialFor(Tenant $tenant, string $documentType): int
    {
        $fallback = max(1, (int) ($tenant->max_official_prints ?? 2));

        return max(1, match ($documentType) {
            'quote' => (int) ($tenant->max_official_devis ?? $fallback),
            'invoice' => (int) ($tenant->max_official_invoices ?? $fallback),
            'delivery_form' => (int) ($tenant->max_official_delivery_forms ?? $fallback),
            'contract' => (int) ($tenant->max_official_contracts ?? $fallback),
            default => $fallback,
        });
    }

    public static function isOfficialGeneration(int $generationCount, int $maxAllowed): bool
    {
        return $generationCount <= $maxAllowed;
    }

    /**
     * @return 'copy'|'duplicate'|null
     */
    public static function copyStrength(int $generationCount, int $maxAllowed): ?string
    {
        if (self::isOfficialGeneration($generationCount, $maxAllowed)) {
            return null;
        }

        return $generationCount === $maxAllowed + 1 ? 'copy' : 'duplicate';
    }

    /**
     * @return array<string, int>
     */
    public static function limitsPayload(Tenant $tenant): array
    {
        return [
            'max_official_devis' => max(1, (int) ($tenant->max_official_devis ?? $tenant->max_official_prints ?? 2)),
            'max_official_invoices' => max(1, (int) ($tenant->max_official_invoices ?? $tenant->max_official_prints ?? 2)),
            'max_official_delivery_forms' => max(1, (int) ($tenant->max_official_delivery_forms ?? $tenant->max_official_prints ?? 2)),
            'max_official_contracts' => max(1, (int) ($tenant->max_official_contracts ?? $tenant->max_official_prints ?? 2)),
        ];
    }
}
