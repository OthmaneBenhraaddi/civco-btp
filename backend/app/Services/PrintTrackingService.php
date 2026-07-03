<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\DeliveryForm;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Quote;
use App\Models\Tenant;
use App\Support\TenantPrintPolicy;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class PrintTrackingService
{
    /**
     * @return array{
     *     is_official: bool,
     *     is_copy: bool,
     *     copy_strength: 'copy'|'duplicate'|null,
     *     watermark_label: string|null,
     *     generation_count: int,
     *     max_allowed: int,
     *     document_type: string,
     *     document_id: int,
     *     tenant_logo_url: string|null,
     *     tenant_name: string|null
     * }
     */
    public function trackPrint(string $documentType, int $documentId, int $companyId): array
    {
        $document = $this->resolveDocument($documentType, $documentId, $companyId);
        $tenant = $this->resolveTenantForDocument($document);
        $maxAllowed = $tenant !== null
            ? TenantPrintPolicy::maxOfficialFor($tenant, $documentType)
            : 2;
        $currentCount = (int) $document->generation_count;
        $generationCount = $currentCount + 1;
        $isOfficial = TenantPrintPolicy::isOfficialGeneration($generationCount, $maxAllowed);

        $document->increment('generation_count');

        return [
            'is_official' => $isOfficial,
            'is_copy' => ! $isOfficial,
            'copy_strength' => TenantPrintPolicy::copyStrength($generationCount, $maxAllowed),
            'watermark_label' => $isOfficial ? null : 'COPIE - NON OFFICIEL',
            'generation_count' => $generationCount,
            'max_allowed' => $maxAllowed,
            'document_type' => $documentType,
            'document_id' => $documentId,
            'tenant_logo_url' => $tenant?->logo_path
                ? \App\Support\TenantLogoStorage::url($tenant->logo_path)
                : null,
            'tenant_name' => $tenant?->name,
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
}
