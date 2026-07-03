<?php

namespace Database\Seeders;

use App\Models\ContractTemplate;
use App\Models\Project;
use App\Models\Tenant;
use App\Services\ContractCompilationService;
use Illuminate\Database\Seeder;

class ContractTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::query()->where('subdomain', 'civco')->first();

        $template = ContractTemplate::query()->updateOrCreate(
            ['title' => 'Contrat de maîtrise d\'œuvre'],
            [
                'tenant_id' => $tenant?->id,
                'content' => <<<'HTML'
<h2 style="font-size:20px;margin:0 0 16px;color:#111827;">Contrat de maîtrise d'œuvre</h2>
<p>Entre la société <strong>{company_name}</strong>, ci-après « le Maître d'œuvre »,</p>
<p>Et le client <strong>{client_name}</strong>, domicilié à {client_city}, ci-après « le Client »,</p>
<p>Il est convenu ce qui suit concernant le projet <strong>{project_title}</strong> (réf. {project_reference}), situé à {project_city}.</p>
<h3 style="font-size:16px;margin:24px 0 8px;">Article 1 — Objet</h3>
<p>Le présent contrat a pour objet la mission de maîtrise d'œuvre confiée au Maître d'œuvre pour la réalisation des travaux décrits dans le dossier technique du projet.</p>
<h3 style="font-size:16px;margin:24px 0 8px;">Article 2 — Durée</h3>
<p>La mission débute à la date de signature du présent contrat et s'achève à la réception des travaux.</p>
<h3 style="font-size:16px;margin:24px 0 8px;">Article 3 — Honoraires</h3>
<p>Les honoraires sont convenus sur la base du budget estimatif du projet : <strong>{project_budget} MAD</strong> (HT), selon les modalités définies dans le devis annexé.</p>
<p>Fait à {project_city}, le {date_short}.</p>
HTML,
            ],
        );

        $project = Project::query()->whereIn('status', ['planned', 'in_progress', 'on_hold'])->first();

        if ($project === null) {
            return;
        }

        if ($project->contracts()->exists()) {
            return;
        }

        app(ContractCompilationService::class)->createContractFromTemplate($template, $project);
    }
}
