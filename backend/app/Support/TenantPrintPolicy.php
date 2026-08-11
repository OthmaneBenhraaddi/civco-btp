<?php

namespace App\Support;

use App\Models\Tenant;

final class TenantPrintPolicy
{
    public static function maxOfficialFor(Tenant $tenant, string $documentType, bool $hasHeader = true): int
    {
        $legacy = self::legacyMaxFor($tenant, $documentType);

        $column = match ($documentType) {
            'quote' => $hasHeader ? 'max_official_devis_with_header' : 'max_official_devis_without_header',
            'invoice' => $hasHeader ? 'max_official_invoices_with_header' : 'max_official_invoices_without_header',
            'delivery_form' => $hasHeader ? 'max_official_delivery_forms_with_header' : 'max_official_delivery_forms_without_header',
            'contract' => $hasHeader ? 'max_official_contracts_with_header' : 'max_official_contracts_without_header',
            default => null,
        };

        if ($column === null) {
            return $legacy;
        }

        $value = $tenant->{$column};

        return max(1, (int) ($value ?? $legacy));
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
            'max_official_devis' => self::legacyMaxFor($tenant, 'quote'),
            'max_official_invoices' => self::legacyMaxFor($tenant, 'invoice'),
            'max_official_delivery_forms' => self::legacyMaxFor($tenant, 'delivery_form'),
            'max_official_contracts' => self::legacyMaxFor($tenant, 'contract'),
            'max_official_devis_with_header' => self::maxOfficialFor($tenant, 'quote', true),
            'max_official_devis_without_header' => self::maxOfficialFor($tenant, 'quote', false),
            'max_official_invoices_with_header' => self::maxOfficialFor($tenant, 'invoice', true),
            'max_official_invoices_without_header' => self::maxOfficialFor($tenant, 'invoice', false),
            'max_official_delivery_forms_with_header' => self::maxOfficialFor($tenant, 'delivery_form', true),
            'max_official_delivery_forms_without_header' => self::maxOfficialFor($tenant, 'delivery_form', false),
            'max_official_contracts_with_header' => self::maxOfficialFor($tenant, 'contract', true),
            'max_official_contracts_without_header' => self::maxOfficialFor($tenant, 'contract', false),
        ];
    }

    private static function legacyMaxFor(Tenant $tenant, string $documentType): int
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
}
