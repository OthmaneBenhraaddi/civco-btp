<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Contract;
use App\Models\DeliveryForm;
use App\Models\Invoice;
use App\Models\Quote;
use App\Models\Tenant;
use App\Support\TenantLogoStorage;
use App\Support\TenantPrintPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PrintTrackingService
{
    /**
     * @return array<string, mixed>
     */
    public function trackPrint(
        string $documentType,
        int $documentId,
        int $companyId,
        bool $hasHeader = true,
    ): array {
        $document = $this->resolveDocument($documentType, $documentId, $companyId);
        $tenant = $this->resolveTenantForDocument($document);
        $company = $this->resolveCompanyForDocument($document, $companyId);

        $headerCountColumn = $hasHeader ? 'prints_with_header_count' : 'prints_without_header_count';
        $currentHeaderCount = (int) ($document->{$headerCountColumn} ?? 0);
        $nextHeaderCount = $currentHeaderCount + 1;

        $maxAllowed = $tenant !== null
            ? TenantPrintPolicy::maxOfficialFor($tenant, $documentType, $hasHeader)
            : 2;
        $isOfficial = TenantPrintPolicy::isOfficialGeneration($nextHeaderCount, $maxAllowed);
        $generationCount = ((int) $document->generation_count) + 1;

        DB::transaction(function () use ($document, $tenant, $hasHeader, $headerCountColumn, $isOfficial): void {
            $document->increment('generation_count');
            $document->increment($headerCountColumn);

            if ($tenant === null) {
                return;
            }

            // Lifetime usage stats on the tenant (all prints of each mode).
            $tenant->increment(
                $hasHeader
                    ? 'official_docs_with_header_count'
                    : 'official_docs_without_header_count'
            );

            // Keep legacy single max in sync with the highest of the split limits for older UIs.
            if ($isOfficial) {
                $tenant->refresh();
            }
        });

        $document->refresh();
        $tenant?->refresh();

        return [
            'is_official' => $isOfficial,
            'is_copy' => ! $isOfficial,
            'copy_strength' => TenantPrintPolicy::copyStrength($nextHeaderCount, $maxAllowed),
            'watermark_label' => $isOfficial ? null : 'COPIE - NON OFFICIEL',
            'generation_count' => $generationCount,
            'prints_with_header_count' => (int) ($document->prints_with_header_count ?? 0),
            'prints_without_header_count' => (int) ($document->prints_without_header_count ?? 0),
            'max_allowed' => $maxAllowed,
            'remaining_official' => max(0, $maxAllowed - $nextHeaderCount),
            'document_type' => $documentType,
            'document_id' => $documentId,
            'has_header' => $hasHeader,
            'official_docs_with_header_count' => (int) ($tenant?->official_docs_with_header_count ?? 0),
            'official_docs_without_header_count' => (int) ($tenant?->official_docs_without_header_count ?? 0),
            'tenant_logo_url' => $hasHeader && $tenant?->logo_path
                ? TenantLogoStorage::url($tenant->logo_path)
                : null,
            'tenant_name' => $hasHeader ? $tenant?->name : null,
            'company' => $hasHeader ? $this->companyPayload($company) : null,
        ];
    }

    private function resolveDocument(string $documentType, int $documentId, int $companyId): Model
    {
        return match ($documentType) {
            'invoice' => $this->findForCompany(Invoice::query(), $documentId, $companyId),
            'quote' => $this->findForCompany(Quote::query(), $documentId, $companyId),
            'delivery_form' => $this->findForCompany(DeliveryForm::query(), $documentId, $companyId),
            'contract' => $this->findContract($documentId, $companyId),
            default => throw new InvalidArgumentException('Type de document non pris en charge.'),
        };
    }

    private function findForCompany($query, int $documentId, int $companyId): Model
    {
        $document = $query->forCompany($companyId)->whereKey($documentId)->first();

        if ($document === null) {
            throw new InvalidArgumentException('Document introuvable.');
        }

        return $document;
    }

    private function findContract(int $documentId, int $companyId): Contract
    {
        $contract = Contract::query()
            ->whereKey($documentId)
            ->whereHas('project', fn ($query) => $query->where('company_id', $companyId))
            ->first();

        if ($contract === null) {
            throw new InvalidArgumentException('Document introuvable.');
        }

        return $contract;
    }

    private function resolveTenantForDocument(Model $document): ?Tenant
    {
        if ($document->tenant_id !== null) {
            return Tenant::query()->find($document->tenant_id);
        }

        if ($document instanceof Contract) {
            $document->loadMissing('project');

            if ($document->project?->tenant_id !== null) {
                return Tenant::query()->find($document->project->tenant_id);
            }
        }

        if (function_exists('current_tenant')) {
            $tenant = current_tenant();

            if ($tenant instanceof Tenant) {
                return $tenant;
            }
        }

        return Tenant::query()->first();
    }

    private function resolveCompanyForDocument(Model $document, int $companyId): ?Company
    {
        if ($document instanceof Contract) {
            $document->loadMissing('project.company');

            return $document->project?->company ?? Company::query()->find($companyId);
        }

        $document->loadMissing('company');

        return $document->company ?? Company::query()->find($companyId);
    }

    /**
     * @return array<string, string|null>|null
     */
    private function companyPayload(?Company $company): ?array
    {
        if ($company === null) {
            return null;
        }

        return [
            'name' => $company->name,
            'legal_name' => $company->legal_name,
            'siret' => $company->siret,
            'email' => $company->email,
            'phone' => $company->phone,
            'address_line1' => $company->address_line1,
            'address_line2' => $company->address_line2,
            'postal_code' => $company->postal_code,
            'city' => $company->city,
            'country' => $company->country,
        ];
    }
}
