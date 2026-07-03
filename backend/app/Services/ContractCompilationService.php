<?php

namespace App\Services;

use App\Enums\ContractStatus;
use App\Models\Company;
use App\Models\Contract;
use App\Models\ContractTemplate;
use App\Models\Project;
use App\Models\Tenant;
use App\Support\TenantLogoStorage;

class ContractCompilationService
{
    /**
     * @return array<string, string>
     */
    public function buildPlaceholderMap(Project $project): array
    {
        $project->loadMissing(['client', 'company']);

        $client = $project->client;
        $company = $project->company;
        $tenant = $this->resolveTenant($project);

        $companyAddress = $this->formatCompanyAddress($company);
        $logoUrl = $this->tenantLogoUrl($tenant);

        return [
            '{client_name}' => $client?->name ?? '',
            '{client_email}' => $client?->email ?? '',
            '{client_phone}' => $client?->phone ?? '',
            '{client_city}' => $client?->city ?? '',
            '{project_title}' => $project->title,
            '{project_reference}' => $project->reference,
            '{project_city}' => $project->site_city ?? '',
            '{project_budget}' => $project->budget !== null ? number_format((float) $project->budget, 2, ',', ' ') : '',
            '{tenant_name}' => $tenant?->name ?? ($company?->name ?? ''),
            '{tenant_subdomain}' => $tenant?->subdomain ?? '',
            '{tenant_logo}' => $logoUrl,
            '{company_name}' => $company?->legal_name ?? $company?->name ?? '',
            '{company_email}' => $company?->email ?? '',
            '{company_phone}' => $company?->phone ?? '',
            '{company_address}' => $companyAddress,
            '{date}' => now()->translatedFormat('d F Y'),
            '{date_short}' => now()->format('d/m/Y'),
        ];
    }

    public function compileTemplateContent(string $templateContent, Project $project): string
    {
        $placeholders = $this->buildPlaceholderMap($project);
        $body = str_replace(array_keys($placeholders), array_values($placeholders), $templateContent);

        return $this->injectDocumentHeader($body, $project);
    }

    public function injectDocumentHeader(string $body, Project $project): string
    {
        $project->loadMissing(['company']);
        $tenant = $this->resolveTenant($project);
        $company = $project->company;
        $logoUrl = $this->tenantLogoUrl($tenant);

        $tenantName = e($tenant?->name ?? $company?->name ?? 'CIVCO');
        $companyName = e($company?->legal_name ?? $company?->name ?? $tenantName);
        $companyAddress = e($this->formatCompanyAddress($company));
        $companyEmail = e($company?->email ?? '');
        $companyPhone = e($company?->phone ?? '');

        $logoMarkup = $logoUrl !== ''
            ? '<img src="'.e($logoUrl).'" alt="'.$tenantName.'" style="max-height:72px;max-width:220px;object-fit:contain;" />'
            : '<div style="font-size:24px;font-weight:700;color:#111827;">'.$tenantName.'</div>';

        $header = <<<HTML
<div class="contract-document-header" style="display:flex;align-items:center;justify-content:space-between;gap:24px;border-bottom:2px solid #e5e7eb;padding-bottom:20px;margin-bottom:28px;">
  <div>{$logoMarkup}</div>
  <div style="text-align:right;font-size:13px;line-height:1.5;color:#374151;">
    <div style="font-size:16px;font-weight:700;color:#111827;">{$companyName}</div>
    <div>{$companyAddress}</div>
    <div>{$companyEmail}</div>
    <div>{$companyPhone}</div>
  </div>
</div>
HTML;

        return $header.$body;
    }

    public function createContractFromTemplate(ContractTemplate $template, Project $project): Contract
    {
        $content = $this->compileTemplateContent($template->content, $project);

        return Contract::query()->create([
            'tenant_id' => $project->tenant_id ?? $template->tenant_id,
            'project_id' => $project->id,
            'client_id' => $project->client_id,
            'contract_template_id' => $template->id,
            'title' => $template->title,
            'content' => $content,
            'status' => ContractStatus::Draft,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function documentContext(Project $project): array
    {
        $project->loadMissing(['client', 'company']);
        $tenant = $this->resolveTenant($project);

        return [
            'placeholders' => $this->buildPlaceholderMap($project),
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'logo_url' => $this->tenantLogoUrl($tenant),
            ] : null,
            'company' => $project->company ? [
                'name' => $project->company->name,
                'legal_name' => $project->company->legal_name,
                'email' => $project->company->email,
                'phone' => $project->company->phone,
                'address' => $this->formatCompanyAddress($project->company),
            ] : null,
        ];
    }

    private function resolveTenant(Project $project): ?Tenant
    {
        if ($project->tenant_id !== null) {
            return Tenant::query()->find($project->tenant_id);
        }

        if (function_exists('current_tenant')) {
            $tenant = current_tenant();

            if ($tenant instanceof Tenant) {
                return $tenant;
            }
        }

        return null;
    }

    private function tenantLogoUrl(?Tenant $tenant): string
    {
        return TenantLogoStorage::url($tenant?->logo_path) ?? '';
    }

    private function formatCompanyAddress(?Company $company): string
    {
        if ($company === null) {
            return '';
        }

        return collect([
            $company->address_line1,
            trim(implode(' ', array_filter([$company->postal_code, $company->city]))),
            $company->country,
        ])->filter()->implode(', ');
    }
}
