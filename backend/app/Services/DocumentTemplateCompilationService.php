<?php

namespace App\Services;

use App\Models\Client;
use App\Models\DocumentTemplate;
use App\Models\Project;
use App\Models\Tenant;
use App\Support\TenantLogoStorage;
use Illuminate\Support\Carbon;

class DocumentTemplateCompilationService
{
    public function __construct(
        private readonly DocumentTemplateService $documentTemplateService,
    ) {}

    /**
     * @return array{key: string, label: string, example: string}
     */
    public function availablePlaceholders(): array
    {
        return [
            ['key' => '{client.name}', 'label' => 'Nom du client', 'example' => 'Atlas Immobilier'],
            ['key' => '{client.contact_name}', 'label' => 'Nom du contact', 'example' => 'M. Yassine Alaoui'],
            ['key' => '{client.email}', 'label' => 'E-mail client', 'example' => 'contact@client.ma'],
            ['key' => '{client.phone}', 'label' => 'Téléphone client', 'example' => '+212 5...'],
            ['key' => '{client.address}', 'label' => 'Adresse client', 'example' => '12, avenue Hassan II'],
            ['key' => '{client.postal_code}', 'label' => 'Code postal client', 'example' => '20000'],
            ['key' => '{client.city}', 'label' => 'Ville client', 'example' => 'Casablanca'],
            ['key' => '{client.country}', 'label' => 'Pays client', 'example' => 'Maroc'],
            ['key' => '{project.name}', 'label' => 'Nom du projet', 'example' => 'Résidence Atlas'],
            ['key' => '{project.reference}', 'label' => 'Référence projet', 'example' => 'PRJ-2026-001'],
            ['key' => '{project.address}', 'label' => 'Adresse du chantier', 'example' => 'Lot 12, quartier Hay Riad'],
            ['key' => '{project.postal_code}', 'label' => 'Code postal du chantier', 'example' => '10100'],
            ['key' => '{project.city}', 'label' => 'Ville projet', 'example' => 'Rabat'],
            ['key' => '{project.start_date}', 'label' => 'Date de début', 'example' => '15/08/2026'],
            ['key' => '{project.end_date}', 'label' => 'Date de fin prévue', 'example' => '15/12/2026'],
            ['key' => '{project.budget}', 'label' => 'Budget du projet', 'example' => '1 250 000,00'],
            ['key' => '{project.progress}', 'label' => 'Avancement du projet', 'example' => '65 %'],
            ['key' => '{project.status}', 'label' => 'Statut du projet', 'example' => 'En cours'],
            ['key' => '{project.sector}', 'label' => 'Secteur du projet', 'example' => 'Bâtiment'],
            ['key' => '{tenant.name}', 'label' => 'Nom de l\'entité', 'example' => 'Atlas BTP'],
            ['key' => '{company.name}', 'label' => 'Nom de la société', 'example' => 'Atlas BTP SARL'],
            ['key' => '{date}', 'label' => 'Date du jour', 'example' => Carbon::now()->format('d/m/Y')],
            ['key' => '{date_short}', 'label' => 'Date courte', 'example' => Carbon::now()->format('d/m/y')],
        ];
    }

    /**
     * Build a flat map supporting both {client.name} and {client_name} styles.
     *
     * @return array<string, string>
     */
    public function buildVariables(
        ?Client $client = null,
        ?Project $project = null,
        ?Tenant $tenant = null,
        ?string $companyName = null,
    ): array {
        $project?->loadMissing(['client', 'company']);
        $client ??= $project?->client;
        $tenant ??= $project?->tenant ?? $client?->tenant;
        $companyName ??= $project?->company?->name;

        $pairs = [
            'client.name' => $client?->name ?? '',
            'client.email' => $client?->email ?? '',
            'client.phone' => $client?->phone ?? '',
            'client.address' => trim(implode(', ', array_filter([
                $client?->address_line1,
                $client?->address_line2,
            ]))),
            'client.postal_code' => $client?->postal_code ?? '',
            'client.city' => $client?->city ?? '',
            'client.country' => $client?->country ?? '',
            'client.contact_name' => $client?->contact_name ?? '',
            'project.name' => $project?->title ?? '',
            'project.title' => $project?->title ?? '',
            'project.reference' => $project?->reference ?? '',
            'project.address' => $project?->site_address_line1 ?? $project?->site_address ?? '',
            'project.postal_code' => $project?->site_postal_code ?? '',
            'project.city' => $project?->site_city ?? $project?->city ?? '',
            'project.budget' => $project?->budget !== null ? (string) $project->budget : '',
            'project.start_date' => $project?->start_date?->format('d/m/Y') ?? '',
            'project.end_date' => $project?->end_date?->format('d/m/Y') ?? '',
            'project.progress' => $project?->progress_percent !== null ? "{$project->progress_percent} %" : '',
            'project.status' => $project?->status?->value ?? '',
            'project.sector' => $project?->sector ?? '',
            'tenant.name' => $tenant?->name ?? '',
            'tenant.subdomain' => $tenant?->subdomain ?? '',
            'tenant.logo' => TenantLogoStorage::url($tenant?->logo_path) ?? '',
            'company.name' => $companyName ?? '',
            'date' => Carbon::now()->format('d/m/Y'),
            'date_short' => Carbon::now()->format('d/m/y'),
        ];

        $variables = [];

        foreach ($pairs as $key => $value) {
            $variables[$key] = (string) $value;
            $variables[str_replace('.', '_', $key)] = (string) $value;
        }

        // Legacy contract-style aliases
        $variables['client_name'] = $variables['client.name'];
        $variables['project_title'] = $variables['project.name'];
        $variables['project_city'] = $variables['project.city'];
        $variables['tenant_name'] = $variables['tenant.name'];
        $variables['company_name'] = $variables['company.name'];

        return $variables;
    }

    public function compile(
        string $body,
        ?Client $client = null,
        ?Project $project = null,
        ?Tenant $tenant = null,
        ?string $companyName = null,
    ): string {
        return $this->documentTemplateService->compile(
            $body,
            $this->buildVariables($client, $project, $tenant, $companyName),
        );
    }

    public function compileTemplate(
        DocumentTemplate $template,
        ?Client $client = null,
        ?Project $project = null,
        ?Tenant $tenant = null,
        ?string $companyName = null,
    ): string {
        return $this->compile(
            $template->body,
            $client,
            $project,
            $tenant ?? $template->tenant,
            $companyName,
        );
    }

    public function countForTenant(int $tenantId): int
    {
        return DocumentTemplate::query()
            ->withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->count();
    }
}
