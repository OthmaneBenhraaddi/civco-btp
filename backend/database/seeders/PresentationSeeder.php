<?php

namespace Database\Seeders;

use App\Enums\ContactRole;
use App\Enums\ExpenseCategory;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\ProjectStatus;
use App\Enums\QuoteStatus;
use App\Enums\TaskStatus;
use App\Models\ActivityLog;
use App\Models\AuditLog;
use App\Models\Badge;
use App\Models\Client;
use App\Models\ClientContact;
use App\Models\Company;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Lot;
use App\Models\Payment;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Quote;
use App\Models\QuoteLine;
use App\Models\Sector;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PresentationSeeder extends Seeder
{
    private const TAX_RATE = 20.0;

    public function run(): void
    {
        $company = Company::query()->where('siret', '12345678901234')->first();
        $admin = User::query()->where('email', 'admin@btpdemo.fr')->first();
        $yassine = User::query()->where('email', 'yassine.mansouri@civco-btp.ma')->first();
        $amine = User::query()->where('email', 'amine.alami@civco-btp.ma')->first();

        if ($company === null || $admin === null || $yassine === null || $amine === null) {
            return;
        }

        DB::transaction(function () use ($company, $admin, $yassine, $amine): void {
            $this->wipeCompanyOperationalData($company->id);

            $importantBadge = Badge::query()->updateOrCreate(
                ['company_id' => $company->id, 'name' => 'Important Client'],
                ['color' => '#EC4899', 'type' => 'client'],
            );

            $alOmrane = Client::query()->create([
                'company_id' => $company->id,
                'name' => 'Société Al Omrane Casablanca',
                'contact_name' => 'Karim Benjelloun',
                'email' => 'karim.benjelloun@alomrane.ma',
                'phone' => '+212 661 284 901',
                'address_line1' => 'Tour Al Omrane, Boulevard Zerktouni',
                'postal_code' => '20100',
                'city' => 'Casablanca',
                'country' => 'MA',
                'notes' => 'Promoteur immobilier — secteur privé, lotissements résidentiels.',
                'is_active' => true,
                'client_role_slug' => 'client_extern',
            ]);

            $sjlMaghreb = Client::query()->create([
                'company_id' => $company->id,
                'name' => 'SJL Maghreb Transport',
                'contact_name' => 'Sanaa Tazi',
                'email' => 's.tazi@sjl-maghreb.ma',
                'phone' => '+212 662 739 118',
                'address_line1' => 'Parc Logistique Zenata, Lot 18',
                'postal_code' => '28810',
                'city' => 'Mohammedia',
                'country' => 'MA',
                'notes' => 'Client industriel — plateformes logistiques et voiries privées.',
                'is_active' => true,
                'client_role_slug' => 'client_extern',
            ]);

            $directionRoutes = Client::query()->create([
                'company_id' => $company->id,
                'name' => 'Direction des Routes (Ministère de l\'Équipement)',
                'contact_name' => 'Ingénieur d\'État Régional',
                'email' => 'marches.public@routes.gov.ma',
                'phone' => '+212 537 789 012',
                'address_line1' => 'Avenue Annakhil, Hay Riad',
                'postal_code' => '10000',
                'city' => 'Rabat',
                'country' => 'MA',
                'notes' => 'Maître d\'ouvrage public — marchés VRD et éclairage urbain.',
                'is_active' => true,
                'client_role_slug' => 'client_extern',
            ]);

            $alOmrane->badges()->sync([$importantBadge->id]);

            ClientContact::query()->create([
                'client_id' => $alOmrane->id,
                'name' => 'Karim Benjelloun',
                'email' => 'karim.benjelloun@alomrane.ma',
                'phone' => '+212 661 284 901',
                'contact_role' => ContactRole::ChefDeProjet,
            ]);

            ClientContact::query()->create([
                'client_id' => $sjlMaghreb->id,
                'name' => 'Sanaa Tazi',
                'email' => 's.tazi@sjl-maghreb.ma',
                'phone' => '+212 662 739 118',
                'contact_role' => ContactRole::Commercial,
            ]);

            ClientContact::query()->create([
                'client_id' => $directionRoutes->id,
                'name' => 'Ingénieur d\'État Régional',
                'email' => 'marches.public@routes.gov.ma',
                'phone' => '+212 537 789 012',
                'contact_role' => ContactRole::ChefDeProjet,
            ]);

            ClientContact::query()->create([
                'client_id' => $directionRoutes->id,
                'name' => 'Service Marchés Publics',
                'email' => 'commande@routes-casa.ma',
                'phone' => '+212 537 789 100',
                'contact_role' => ContactRole::Commercial,
            ]);

            $apdnNord = Client::query()->create([
                'company_id' => $company->id,
                'name' => 'APDN — Agence pour la Promotion et le Développement du Nord',
                'contact_name' => 'Nadia El Fassi',
                'email' => 'n.el-fassi@apdn.ma',
                'phone' => '+212 539 942 180',
                'address_line1' => 'Boulevard Mohamed V, Immeuble Al Amal',
                'postal_code' => '90000',
                'city' => 'Tanger',
                'country' => 'MA',
                'notes' => 'Maître d\'ouvrage régional — aménagements littoraux et VRD urbains.',
                'is_active' => true,
                'client_role_slug' => 'client_extern',
            ]);

            $palmeraieResort = Client::query()->create([
                'company_id' => $company->id,
                'name' => 'Palmeraie Golf & Resort SARL',
                'contact_name' => 'Hassan Bennani',
                'email' => 'h.bennani@palmeraie-golf.ma',
                'phone' => '+212 661 902 447',
                'address_line1' => 'Circuit de la Palmeraie, Km 8',
                'postal_code' => '40000',
                'city' => 'Marrakech',
                'country' => 'MA',
                'notes' => 'Promoteur hôtelier — résidences de prestige et équipements golf.',
                'is_active' => true,
                'client_role_slug' => 'client_extern',
            ]);

            ClientContact::query()->create([
                'client_id' => $apdnNord->id,
                'name' => 'Nadia El Fassi',
                'email' => 'n.el-fassi@apdn.ma',
                'phone' => '+212 539 942 180',
                'contact_role' => ContactRole::ChefDeProjet,
            ]);

            ClientContact::query()->create([
                'client_id' => $palmeraieResort->id,
                'name' => 'Hassan Bennani',
                'email' => 'h.bennani@palmeraie-golf.ma',
                'phone' => '+212 661 902 447',
                'contact_role' => ContactRole::Commercial,
            ]);

            $villaProject = Project::query()->create([
                'company_id' => $company->id,
                'client_id' => $alOmrane->id,
                'reference' => 'PRJ-2026-001',
                'title' => 'Construction Villa Résidentielle — Lotissement California (Bâtiment)',
                'description' => 'Construction d\'une villa R+1 clé en main — gros œuvre, second œuvre et finitions. Lotissement California, Casablanca.',
                'status' => ProjectStatus::InProgress,
                'nature' => 'BÂTIMENT',
                'sector' => 'PRIVÉ',
                'etat_paiement' => 'NON PAYÉ',
                'delais' => '9 mois — livraison prévue fin 2026',
                'avancement' => 'Gros œuvre achevé — démarrage second œuvre',
                'start_date' => now()->subMonths(7)->toDateString(),
                'end_date' => now()->addMonths(2)->toDateString(),
                'actual_start_date' => now()->subMonths(6)->toDateString(),
                'budget' => 385_000.00,
                'progress_percent' => 58.00,
                'site_address_line1' => 'Lot 47, Lotissement California',
                'site_city' => 'Casablanca',
                'site_postal_code' => '20460',
                'site_address' => 'Lot 47, Lotissement California, 20460 Casablanca',
                'latitude' => 33.5480000,
                'longitude' => -7.6320000,
            ]);

            $panoramiqueProject = Project::query()->create([
                'company_id' => $company->id,
                'client_id' => $directionRoutes->id,
                'reference' => 'PRJ-2026-002',
                'title' => 'Aménagement du Boulevard Panoramique (VRD)',
                'description' => 'VRD sur 1,8 km : terrassement, chaussée, trottoirs, réseaux EP/EU et signalisation — axe Panoramique, Casablanca.',
                'status' => ProjectStatus::InProgress,
                'nature' => 'VRD',
                'sector' => 'PUBLIC',
                'etat_paiement' => 'NON PAYÉ',
                'delais' => '14 mois — marché public N° VRD/CAS/2025-18',
                'avancement' => 'Terrassement terminé — démarrage voirie',
                'start_date' => now()->subMonths(8)->toDateString(),
                'end_date' => now()->addMonths(6)->toDateString(),
                'actual_start_date' => now()->subMonths(7)->toDateString(),
                'budget' => 2_800_000.00,
                'progress_percent' => 34.00,
                'site_address_line1' => 'Boulevard Panoramique',
                'site_city' => 'Casablanca',
                'site_postal_code' => '20150',
                'site_address' => 'Boulevard Panoramique, 20150 Casablanca',
                'latitude' => 33.5950000,
                'longitude' => -7.6200000,
            ]);

            $eclairageProject = Project::query()->create([
                'company_id' => $company->id,
                'client_id' => $directionRoutes->id,
                'reference' => 'PRJ-2026-003',
                'title' => 'Réhabilitation de l\'Éclairage Public Ain Chock (Electricité/VRD)',
                'description' => 'Remplacement de 120 candélabres LED, tranchées réseaux et raccordements — quartier Ain Chock.',
                'status' => ProjectStatus::InProgress,
                'nature' => 'VRD',
                'sector' => 'PUBLIC',
                'etat_paiement' => 'NON PAYÉ',
                'delais' => '8 mois — contrat cadre éclairage urbain',
                'avancement' => '60 % des points lumineux posés',
                'start_date' => now()->subMonths(5)->toDateString(),
                'end_date' => now()->addMonths(3)->toDateString(),
                'actual_start_date' => now()->subMonths(4)->toDateString(),
                'budget' => 1_250_000.00,
                'progress_percent' => 61.00,
                'site_address_line1' => 'Quartier Ain Chock, Avenue Rahal El Meskini',
                'site_city' => 'Casablanca',
                'site_postal_code' => '20480',
                'site_address' => 'Avenue Rahal El Meskini, Ain Chock, 20480 Casablanca',
                'latitude' => 33.5330000,
                'longitude' => -7.6750000,
            ]);

            $sjlProject = Project::query()->create([
                'company_id' => $company->id,
                'client_id' => $sjlMaghreb->id,
                'reference' => 'PRJ-2026-004',
                'title' => 'Plateforme Logistique & Voirie d\'Accès SJL (VRD)',
                'description' => 'Plateforme béton 4 500 m², voirie d\'accès, bassin de rétention et éclairage — parc Zenata.',
                'status' => ProjectStatus::InProgress,
                'nature' => 'VRD',
                'sector' => 'PRIVÉ',
                'etat_paiement' => 'NON PAYÉ',
                'delais' => '11 mois',
                'avancement' => 'Terrassement et réseaux en cours',
                'start_date' => now()->subMonths(3)->toDateString(),
                'end_date' => now()->addMonths(8)->toDateString(),
                'actual_start_date' => now()->subMonths(2)->toDateString(),
                'budget' => 1_650_000.00,
                'progress_percent' => 22.00,
                'site_address_line1' => 'Parc Logistique Zenata, Lot 18',
                'site_city' => 'Mohammedia',
                'site_postal_code' => '28810',
                'site_address' => 'Parc Logistique Zenata, 28810 Mohammedia',
                'latitude' => 33.4547000,
                'longitude' => -7.5143000,
            ]);

            $malabataProject = Project::query()->create([
                'company_id' => $company->id,
                'client_id' => $apdnNord->id,
                'reference' => 'PRJ-2026-005',
                'title' => 'Promenade & VRD Corniche Malabata — Extension Littorale (VRD)',
                'description' => 'Aménagement de 1,2 km de promenade piétonne, trottoirs en pierre locale, réseaux EP/EU et éclairage LED sur la corniche Malabata — phase 2 extension littorale.',
                'status' => ProjectStatus::InProgress,
                'nature' => 'VRD',
                'sector' => 'PUBLIC',
                'etat_paiement' => 'NON PAYÉ',
                'delais' => '10 mois — convention APDN / Région Tanger-Tétouan-Al Hoceïma',
                'avancement' => 'Terrassement littoral terminé — pose revêtements en cours',
                'start_date' => now()->subMonths(4)->toDateString(),
                'end_date' => now()->addMonths(6)->toDateString(),
                'actual_start_date' => now()->subMonths(3)->toDateString(),
                'budget' => 1_950_000.00,
                'progress_percent' => 27.00,
                'site_address_line1' => 'Corniche de Malabata, secteur extension ouest',
                'site_city' => 'Tanger',
                'site_postal_code' => '90070',
                'site_address' => 'Corniche de Malabata, 90070 Tanger',
                'latitude' => 35.7642000,
                'longitude' => -5.7991000,
            ]);

            $palmeraieProject = Project::query()->create([
                'company_id' => $company->id,
                'client_id' => $palmeraieResort->id,
                'reference' => 'PRJ-2026-006',
                'title' => 'Construction Club House R+2 — Palmeraie Golf Resort (BÂTIMENT)',
                'description' => 'Club house 1 850 m² SDP : structure béton armé R+2, spa, restaurant panoramique et terrasses sur la Palmeraie — finitions haut de gamme.',
                'status' => ProjectStatus::InProgress,
                'nature' => 'BÂTIMENT',
                'sector' => 'PRIVÉ',
                'etat_paiement' => 'NON PAYÉ',
                'delais' => '13 mois — livraison avant haute saison 2027',
                'avancement' => 'Dalle RDC coulée — montage structure R+1',
                'start_date' => now()->subMonths(5)->toDateString(),
                'end_date' => now()->addMonths(8)->toDateString(),
                'actual_start_date' => now()->subMonths(4)->toDateString(),
                'budget' => 2_150_000.00,
                'progress_percent' => 44.00,
                'site_address_line1' => 'Circuit de la Palmeraie, Parcelle Golf Nord',
                'site_city' => 'Marrakech',
                'site_postal_code' => '40000',
                'site_address' => 'Circuit de la Palmeraie, 40000 Marrakech',
                'latitude' => 31.6470000,
                'longitude' => -7.9812000,
            ]);

            foreach ([
                [$villaProject, 'BÂTIMENT', ['Terrassement', 'Gros Œuvre', 'Finitions']],
                [$panoramiqueProject, 'VRD', ['Terrassement', 'Voirie', 'Réseaux divers']],
                [$eclairageProject, 'VRD', ['Tranchées & réseaux', 'Éclairage', 'Réception']],
                [$sjlProject, 'VRD', ['Terrassement', 'Plateforme', 'Voirie']],
                [$malabataProject, 'VRD', ['Terrassement', 'Voirie', 'Éclairage']],
                [$palmeraieProject, 'BÂTIMENT', ['Terrassement', 'Gros Œuvre', 'Finitions']],
            ] as [$project, $sectorName, $lotNames]) {
                $sector = Sector::query()->firstOrCreate(
                    ['company_id' => $company->id, 'name' => $sectorName],
                );

                $lotIds = collect($lotNames)->map(fn (string $name) => Lot::query()->firstOrCreate(
                    ['company_id' => $company->id, 'name' => $name],
                    ['sector_id' => $sector->id],
                )->id)->all();

                $project->lots()->sync($lotIds);
            }

            $villaProject->teamMembers()->sync([
                $amine->id => ['role_label' => 'Ingénieur Suivi', 'assigned_at' => now()->subMonths(6)->toDateString()],
                $admin->id => ['role_label' => 'Direction travaux', 'assigned_at' => now()->subMonths(6)->toDateString()],
            ]);

            $panoramiqueProject->teamMembers()->sync([
                $yassine->id => ['role_label' => 'Conducteur de travaux', 'assigned_at' => now()->subMonths(7)->toDateString()],
            ]);

            $eclairageProject->teamMembers()->sync([
                $yassine->id => ['role_label' => 'Conducteur de travaux', 'assigned_at' => now()->subMonths(4)->toDateString()],
                $amine->id => ['role_label' => 'Ingénieur Suivi', 'assigned_at' => now()->subMonths(4)->toDateString()],
            ]);

            $sjlProject->teamMembers()->sync([
                $yassine->id => ['role_label' => 'Conducteur de travaux', 'assigned_at' => now()->subMonths(2)->toDateString()],
            ]);

            $malabataProject->teamMembers()->sync([
                $yassine->id => ['role_label' => 'Conducteur de travaux', 'assigned_at' => now()->subMonths(3)->toDateString()],
                $amine->id => ['role_label' => 'Ingénieur Suivi', 'assigned_at' => now()->subMonths(3)->toDateString()],
            ]);

            $palmeraieProject->teamMembers()->sync([
                $amine->id => ['role_label' => 'Ingénieur Suivi', 'assigned_at' => now()->subMonths(4)->toDateString()],
                $admin->id => ['role_label' => 'Direction travaux', 'assigned_at' => now()->subMonths(4)->toDateString()],
            ]);

            $this->seedPhasesAndTasks($villaProject, $amine, [
                [
                    'name' => 'Terrassement',
                    'sort_order' => 0,
                    'progress_percent' => 100.00,
                    'planned_start_date' => now()->subMonths(6),
                    'planned_end_date' => now()->subMonths(5),
                    'tasks' => [
                        ['title' => 'Implantation et fouilles', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                    ],
                ],
                [
                    'name' => 'Gros Œuvre',
                    'sort_order' => 1,
                    'progress_percent' => 72.00,
                    'planned_start_date' => now()->subMonths(5),
                    'planned_end_date' => now()->subMonth(),
                    'tasks' => [
                        ['title' => 'Fondations et soubassement', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                        ['title' => 'Élévation murs et dalle R+1', 'status' => TaskStatus::InProgress, 'progress_percent' => 65],
                    ],
                ],
                [
                    'name' => 'Finitions',
                    'sort_order' => 2,
                    'progress_percent' => 5.00,
                    'planned_start_date' => now()->subWeeks(2),
                    'planned_end_date' => now()->addMonths(2),
                    'tasks' => [
                        ['title' => 'Enduits et peinture intérieure', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
            ]);

            $this->seedPhasesAndTasks($panoramiqueProject, $yassine, [
                [
                    'name' => 'Terrassement',
                    'sort_order' => 0,
                    'progress_percent' => 100.00,
                    'planned_start_date' => now()->subMonths(7),
                    'planned_end_date' => now()->subMonths(4),
                    'tasks' => [
                        ['title' => 'Décapage et mise en forme plateforme', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                    ],
                ],
                [
                    'name' => 'Voirie',
                    'sort_order' => 1,
                    'progress_percent' => 28.00,
                    'planned_start_date' => now()->subMonths(4),
                    'planned_end_date' => now()->addMonths(3),
                    'tasks' => [
                        ['title' => 'Couche de base GNB', 'status' => TaskStatus::InProgress, 'progress_percent' => 40],
                        ['title' => 'Pose bordures et trottoirs', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
                [
                    'name' => 'Réseaux divers',
                    'sort_order' => 2,
                    'progress_percent' => 12.00,
                    'planned_start_date' => now()->subMonths(2),
                    'planned_end_date' => now()->addMonths(5),
                    'tasks' => [
                        ['title' => 'Canalisation EP Ø400', 'status' => TaskStatus::InProgress, 'progress_percent' => 20],
                    ],
                ],
            ]);

            $this->seedPhasesAndTasks($eclairageProject, $amine, [
                [
                    'name' => 'Tranchées & réseaux',
                    'sort_order' => 0,
                    'progress_percent' => 85.00,
                    'planned_start_date' => now()->subMonths(4),
                    'planned_end_date' => now()->subMonth(),
                    'tasks' => [
                        ['title' => 'Tranchées réseaux électriques', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                    ],
                ],
                [
                    'name' => 'Éclairage',
                    'sort_order' => 1,
                    'progress_percent' => 61.00,
                    'planned_start_date' => now()->subMonths(3),
                    'planned_end_date' => now()->addMonth(),
                    'tasks' => [
                        ['title' => 'Pose candélabres LED 120 W', 'status' => TaskStatus::InProgress, 'progress_percent' => 60],
                    ],
                ],
            ]);

            $this->seedPhasesAndTasks($malabataProject, $yassine, [
                [
                    'name' => 'Terrassement',
                    'sort_order' => 0,
                    'progress_percent' => 100.00,
                    'planned_start_date' => now()->subMonths(3),
                    'planned_end_date' => now()->subMonths(2),
                    'tasks' => [
                        ['title' => 'Remblai littoral et nivellement plateforme', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                    ],
                ],
                [
                    'name' => 'Voirie',
                    'sort_order' => 1,
                    'progress_percent' => 22.00,
                    'planned_start_date' => now()->subMonths(2),
                    'planned_end_date' => now()->addMonths(3),
                    'tasks' => [
                        ['title' => 'Pose dalles pierre naturelle — promenade 1 200 ml', 'status' => TaskStatus::InProgress, 'progress_percent' => 25],
                        ['title' => 'Bordures et garde-corps métalliques', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
                [
                    'name' => 'Éclairage',
                    'sort_order' => 2,
                    'progress_percent' => 0.00,
                    'planned_start_date' => now()->addMonth(),
                    'planned_end_date' => now()->addMonths(5),
                    'tasks' => [
                        ['title' => 'Candélabres LED basse consommation — 48 points', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
            ]);

            $this->seedPhasesAndTasks($palmeraieProject, $amine, [
                [
                    'name' => 'Terrassement',
                    'sort_order' => 0,
                    'progress_percent' => 100.00,
                    'planned_start_date' => now()->subMonths(4),
                    'planned_end_date' => now()->subMonths(3),
                    'tasks' => [
                        ['title' => 'Fouilles et fondations profondes', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                    ],
                ],
                [
                    'name' => 'Gros Œuvre',
                    'sort_order' => 1,
                    'progress_percent' => 52.00,
                    'planned_start_date' => now()->subMonths(3),
                    'planned_end_date' => now()->addMonths(2),
                    'tasks' => [
                        ['title' => 'Dalle RDC et poteaux — 1 850 m²', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                        ['title' => 'Élévation murs R+1 et plancher haut', 'status' => TaskStatus::InProgress, 'progress_percent' => 55],
                    ],
                ],
                [
                    'name' => 'Finitions',
                    'sort_order' => 2,
                    'progress_percent' => 0.00,
                    'planned_start_date' => now()->addMonths(2),
                    'planned_end_date' => now()->addMonths(8),
                    'tasks' => [
                        ['title' => 'Menuiseries aluminium et verrières spa', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
            ]);

            $quoteVilla = $this->seedQuote(
                $company->id,
                $alOmrane->id,
                $villaProject->id,
                'DEVIS-2026-001',
                QuoteStatus::Accepted,
                now()->subMonths(6),
                now()->subMonths(4),
                'Devis villa California — gros œuvre et finitions.',
                [
                    ['description' => 'Gros œuvre villa R+1 — forfait', 'quantity' => 1, 'unit_price_ht' => 210_000],
                    ['description' => 'Second œuvre et finitions', 'quantity' => 1, 'unit_price_ht' => 110_000],
                ],
            );

            $quotePanoramique = $this->seedQuote(
                $company->id,
                $directionRoutes->id,
                $panoramiqueProject->id,
                'DEVIS-2026-002',
                QuoteStatus::Accepted,
                now()->subMonths(7),
                now()->subMonths(5),
                'Marché public VRD — Boulevard Panoramique.',
                [
                    ['description' => 'Terrassement et plateforme — 18 000 m²', 'quantity' => 18_000, 'unit_price_ht' => 42],
                    ['description' => 'Voirie et trottoirs — 1 800 ml', 'quantity' => 1_800, 'unit_price_ht' => 620],
                    ['description' => 'Réseaux divers EP/EU — forfait', 'quantity' => 1, 'unit_price_ht' => 680_000],
                ],
            );

            $quoteEclairage = $this->seedQuote(
                $company->id,
                $directionRoutes->id,
                $eclairageProject->id,
                'DEVIS-2026-003',
                QuoteStatus::Accepted,
                now()->subMonths(5),
                now()->subMonths(3),
                'Contrat réhabilitation éclairage public Ain Chock.',
                [
                    ['description' => 'Fourniture candélabres LED — 120 unités', 'quantity' => 120, 'unit_price_ht' => 4_200],
                    ['description' => 'Pose et raccordements — forfait', 'quantity' => 1, 'unit_price_ht' => 385_000],
                ],
            );

            $this->seedQuote(
                $company->id,
                $sjlMaghreb->id,
                $sjlProject->id,
                'DEVIS-2026-004',
                QuoteStatus::Sent,
                now()->subMonths(2),
                now()->addMonth(),
                'Devis plateforme logistique SJL — en attente signature.',
                [
                    ['description' => 'Plateforme béton 4 500 m²', 'quantity' => 4_500, 'unit_price_ht' => 185],
                    ['description' => 'Voirie d\'accès et éclairage', 'quantity' => 1, 'unit_price_ht' => 420_000],
                ],
            );

            $quoteMalabata = $this->seedQuote(
                $company->id,
                $apdnNord->id,
                $malabataProject->id,
                'DEVIS-2026-005',
                QuoteStatus::Accepted,
                now()->subMonths(4),
                now()->subMonths(2),
                'Convention APDN — promenade et VRD Corniche Malabata.',
                [
                    ['description' => 'Terrassement littoral et remblais — 8 500 m³', 'quantity' => 8_500, 'unit_price_ht' => 38],
                    ['description' => 'Promenade pierre naturelle — 1 200 ml', 'quantity' => 1_200, 'unit_price_ht' => 485],
                    ['description' => 'Réseaux EP/EU et éclairage LED — forfait', 'quantity' => 1, 'unit_price_ht' => 520_000],
                ],
            );

            $quotePalmeraie = $this->seedQuote(
                $company->id,
                $palmeraieResort->id,
                $palmeraieProject->id,
                'DEVIS-2026-006',
                QuoteStatus::Accepted,
                now()->subMonths(5),
                now()->subMonths(3),
                'Devis club house Palmeraie Golf — gros œuvre et finitions premium.',
                [
                    ['description' => 'Gros œuvre béton armé R+2 — 1 850 m² SDP', 'quantity' => 1_850, 'unit_price_ht' => 620],
                    ['description' => 'Second œuvre spa & restaurant — forfait', 'quantity' => 1, 'unit_price_ht' => 485_000],
                ],
            );

            $this->seedInvoice(
                $company->id,
                $alOmrane->id,
                $villaProject->id,
                $quoteVilla->id,
                'FACT-2026-001',
                InvoiceStatus::Paid,
                now()->subMonths(6),
                now()->subMonths(5),
                'Acompte 25 % — démarrage villa California.',
                [['description' => 'Acompte travaux villa California', 'quantity' => 1, 'unit_price_ht' => 80_000]],
                amountPaid: 96_000.00,
                payments: [['amount' => 96_000.00, 'paid_at' => now()->subMonths(6), 'method' => PaymentMethod::BankTransfer, 'reference' => 'VIR-ALO-2025-441', 'notes' => 'Virement Al Omrane']],
            );

            $this->seedInvoice(
                $company->id,
                $alOmrane->id,
                $villaProject->id,
                $quoteVilla->id,
                'FACT-2026-002',
                InvoiceStatus::PartiallyPaid,
                now()->subMonths(3),
                now()->addDays(20),
                'Situation n°2 — gros œuvre villa California.',
                [['description' => 'Situation gros œuvre — tranche 2', 'quantity' => 1, 'unit_price_ht' => 96_000]],
                amountPaid: 57_600.00,
                payments: [['amount' => 57_600.00, 'paid_at' => now()->subMonths(3), 'method' => PaymentMethod::BankTransfer, 'reference' => 'VIR-ALO-2026-018', 'notes' => 'Situation n°2']],
            );

            $this->seedInvoice(
                $company->id,
                $directionRoutes->id,
                $eclairageProject->id,
                $quoteEclairage->id,
                'FACT-2026-003',
                InvoiceStatus::PartiallyPaid,
                now()->subMonths(5),
                now()->subMonths(3),
                'Tranche 1 — fourniture candélabres Ain Chock.',
                [['description' => 'Tranche 1 éclairage public', 'quantity' => 1, 'unit_price_ht' => 150_000]],
                amountPaid: 180_000.00,
                payments: [['amount' => 180_000.00, 'paid_at' => now()->subMonths(5), 'method' => PaymentMethod::BankTransfer, 'reference' => 'MANDAT-DR-2025-771', 'notes' => 'Mandat administratif tranche 1']],
            );

            $this->seedInvoice(
                $company->id,
                $directionRoutes->id,
                $eclairageProject->id,
                $quoteEclairage->id,
                'FACT-2026-004',
                InvoiceStatus::Paid,
                now()->subMonths(2),
                now()->subMonth(),
                'Tranche 2 — pose candélabres Ain Chock.',
                [['description' => 'Tranche 2 pose et raccordements', 'quantity' => 1, 'unit_price_ht' => 183_333]],
                amountPaid: 220_000.00,
                payments: [['amount' => 220_000.00, 'paid_at' => now()->subMonths(2), 'method' => PaymentMethod::BankTransfer, 'reference' => 'MANDAT-DR-2026-042', 'notes' => 'Mandat tranche 2']],
            );

            $this->seedInvoice(
                $company->id,
                $directionRoutes->id,
                $panoramiqueProject->id,
                $quotePanoramique->id,
                'FACT-2026-005',
                InvoiceStatus::PartiallyPaid,
                now()->subMonths(6),
                now()->subMonths(4),
                'Tranche 1 — terrassement Boulevard Panoramique.',
                [['description' => 'Tranche terrassement (30 %)', 'quantity' => 1, 'unit_price_ht' => 300_000]],
                amountPaid: 360_000.00,
                payments: [['amount' => 360_000.00, 'paid_at' => now()->subMonths(6), 'method' => PaymentMethod::BankTransfer, 'reference' => 'MANDAT-DR-2025-902', 'notes' => 'Tranche terrassement']],
            );

            $this->seedInvoice(
                $company->id,
                $directionRoutes->id,
                $panoramiqueProject->id,
                $quotePanoramique->id,
                'FACT-2026-006',
                InvoiceStatus::PartiallyPaid,
                now()->subMonths(3),
                now()->addWeeks(2),
                'Tranche 2 — voirie Boulevard Panoramique.',
                [['description' => 'Tranche voirie (25 %)', 'quantity' => 1, 'unit_price_ht' => 350_000]],
                amountPaid: 420_000.00,
                payments: [['amount' => 420_000.00, 'paid_at' => now()->subMonths(3), 'method' => PaymentMethod::BankTransfer, 'reference' => 'MANDAT-DR-2026-088', 'notes' => 'Tranche voirie']],
            );

            $this->seedInvoice(
                $company->id,
                $directionRoutes->id,
                $panoramiqueProject->id,
                $quotePanoramique->id,
                'FACT-2026-007',
                InvoiceStatus::Sent,
                now()->subWeeks(3),
                now()->addWeeks(3),
                'Tranche 3 — réseaux EP Boulevard Panoramique.',
                [['description' => 'Tranche réseaux divers', 'quantity' => 1, 'unit_price_ht' => 233_333]],
                amountPaid: 0.00,
                payments: [],
            );

            $this->seedInvoice(
                $company->id,
                $directionRoutes->id,
                $panoramiqueProject->id,
                null,
                'FACT-2026-008',
                InvoiceStatus::Paid,
                now()->subMonth(),
                now()->subWeeks(2),
                'Révision prix — signalisation provisoire.',
                [['description' => 'Signalisation et balisage chantier', 'quantity' => 1, 'unit_price_ht' => 166_667]],
                amountPaid: 200_000.00,
                payments: [['amount' => 200_000.00, 'paid_at' => now()->subMonth(), 'method' => PaymentMethod::BankTransfer, 'reference' => 'MANDAT-DR-2026-114', 'notes' => 'Signalisation']],
            );

            $this->seedInvoice(
                $company->id,
                $apdnNord->id,
                $malabataProject->id,
                $quoteMalabata->id,
                'FACT-2026-009',
                InvoiceStatus::PartiallyPaid,
                now()->subMonths(3),
                now()->addWeeks(2),
                'Tranche 1 — terrassement littoral Corniche Malabata.',
                [['description' => 'Tranche terrassement et remblais (35 %)', 'quantity' => 1, 'unit_price_ht' => 227_500]],
                amountPaid: 273_000.00,
                payments: [['amount' => 273_000.00, 'paid_at' => now()->subMonths(3), 'method' => PaymentMethod::BankTransfer, 'reference' => 'VIR-APDN-2026-031', 'notes' => 'Virement APDN tranche 1']],
            );

            $this->seedInvoice(
                $company->id,
                $palmeraieResort->id,
                $palmeraieProject->id,
                $quotePalmeraie->id,
                'FACT-2026-010',
                InvoiceStatus::PartiallyPaid,
                now()->subMonths(4),
                now()->addMonth(),
                'Acompte 30 % — démarrage club house Palmeraie.',
                [['description' => 'Acompte gros œuvre club house', 'quantity' => 1, 'unit_price_ht' => 344_500]],
                amountPaid: 413_400.00,
                payments: [['amount' => 413_400.00, 'paid_at' => now()->subMonths(4), 'method' => PaymentMethod::BankTransfer, 'reference' => 'VIR-PGR-2026-008', 'notes' => 'Virement Palmeraie Golf & Resort']],
            );

            Expense::query()->create([
                'project_id' => $villaProject->id,
                'recorded_by_user_id' => $amine->id,
                'category' => ExpenseCategory::Materials,
                'label' => 'Ciment CPJ45 et acier HA — villa California',
                'amount' => 48_500.00,
                'expense_date' => now()->subMonths(4)->toDateString(),
                'notes' => 'Livraison Lafarge — lot gros œuvre',
            ]);

            Expense::query()->create([
                'project_id' => $panoramiqueProject->id,
                'recorded_by_user_id' => $yassine->id,
                'category' => ExpenseCategory::Equipment,
                'label' => 'Location pelle 20 t et compacteur — 12 jours',
                'amount' => 142_000.00,
                'expense_date' => now()->subMonths(5)->toDateString(),
                'notes' => 'Terrassement Boulevard Panoramique',
            ]);

            Expense::query()->create([
                'project_id' => $eclairageProject->id,
                'recorded_by_user_id' => $amine->id,
                'category' => ExpenseCategory::Materials,
                'label' => 'Candélabres LED 120 W — lot 40 unités',
                'amount' => 96_800.00,
                'expense_date' => now()->subMonths(2)->toDateString(),
                'notes' => 'Fournisseur Éclairage Maroc',
            ]);

            Expense::query()->create([
                'project_id' => $malabataProject->id,
                'recorded_by_user_id' => $yassine->id,
                'category' => ExpenseCategory::Materials,
                'label' => 'Dalles pierre naturelle Taza — lot 420 m²',
                'amount' => 118_600.00,
                'expense_date' => now()->subWeeks(3)->toDateString(),
                'notes' => 'Livraison corniche Malabata — promenade piétonne',
            ]);

            Expense::query()->create([
                'project_id' => $palmeraieProject->id,
                'recorded_by_user_id' => $amine->id,
                'category' => ExpenseCategory::Materials,
                'label' => 'Béton HA et coffrage — dalle RDC club house',
                'amount' => 86_200.00,
                'expense_date' => now()->subMonths(2)->toDateString(),
                'notes' => 'Centrale Lafarge Marrakech — coulage RDC',
            ]);

            $this->seedAuditLogs($company->id, $admin, $villaProject, $panoramiqueProject, $quoteVilla);
            $this->seedActivityLogs($company->id, $admin, $yassine, $amine, $villaProject, $panoramiqueProject, $eclairageProject, $malabataProject, $palmeraieProject);
        });
    }

    private function wipeCompanyOperationalData(int $companyId): void
    {
        $projectIds = Project::query()->where('company_id', $companyId)->pluck('id');
        $clientIds = Client::query()->where('company_id', $companyId)->pluck('id');
        $invoiceIds = Invoice::query()->where('company_id', $companyId)->pluck('id');
        $quoteIds = Quote::query()->where('company_id', $companyId)->pluck('id');

        if ($invoiceIds->isNotEmpty()) {
            Payment::query()->whereIn('invoice_id', $invoiceIds)->delete();
            InvoiceLine::query()->whereIn('invoice_id', $invoiceIds)->delete();
        }

        if ($quoteIds->isNotEmpty()) {
            QuoteLine::query()->whereIn('quote_id', $quoteIds)->delete();
        }

        Invoice::query()->where('company_id', $companyId)->delete();
        Quote::query()->where('company_id', $companyId)->delete();

        if ($projectIds->isNotEmpty()) {
            Expense::query()->whereIn('project_id', $projectIds)->delete();
            Task::query()->whereIn('project_phase_id', ProjectPhase::query()->whereIn('project_id', $projectIds)->pluck('id'))->delete();
            ProjectPhase::query()->whereIn('project_id', $projectIds)->delete();
            DB::table('project_user')->whereIn('project_id', $projectIds)->delete();
            DB::table('lot_project')->whereIn('project_id', $projectIds)->delete();
            Project::query()->whereIn('id', $projectIds)->delete();
        }

        if ($clientIds->isNotEmpty()) {
            ClientContact::query()->whereIn('client_id', $clientIds)->delete();
            DB::table('badge_client')->whereIn('client_id', $clientIds)->delete();
            Client::query()->whereIn('id', $clientIds)->delete();
        }

        AuditLog::query()->where('company_id', $companyId)->delete();
        ActivityLog::query()->where('company_id', $companyId)->delete();
    }

    /**
     * @param  array<int, array{name: string, sort_order: int, progress_percent: float, planned_start_date: \Illuminate\Support\Carbon, planned_end_date: \Illuminate\Support\Carbon, tasks: array<int, array{title: string, status: TaskStatus, progress_percent: int}>}>  $phases
     */
    private function seedPhasesAndTasks(Project $project, User $assignee, array $phases): void
    {
        $project->phases()->each(fn (ProjectPhase $phase) => $phase->tasks()->delete());
        $project->phases()->delete();

        foreach ($phases as $phaseData) {
            $phase = $project->phases()->create([
                'name' => $phaseData['name'],
                'sort_order' => $phaseData['sort_order'],
                'planned_start_date' => $phaseData['planned_start_date']->toDateString(),
                'planned_end_date' => $phaseData['planned_end_date']->toDateString(),
                'progress_percent' => $phaseData['progress_percent'],
            ]);

            foreach ($phaseData['tasks'] as $index => $taskData) {
                $phase->tasks()->create([
                    'assigned_to_user_id' => $assignee->id,
                    'title' => $taskData['title'],
                    'status' => $taskData['status'],
                    'progress_percent' => $taskData['progress_percent'],
                    'due_date' => $phaseData['planned_end_date']->copy()->subWeeks(2)->toDateString(),
                    'completed_at' => $taskData['status'] === TaskStatus::Done ? now()->subWeek() : null,
                    'sort_order' => $index,
                ]);
            }
        }
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $lines
     */
    private function seedQuote(
        int $companyId,
        int $clientId,
        int $projectId,
        string $reference,
        QuoteStatus $status,
        \Illuminate\Support\Carbon $issuedAt,
        \Illuminate\Support\Carbon $validUntil,
        string $notes,
        array $lines,
    ): Quote {
        $quote = Quote::query()->create([
            'company_id' => $companyId,
            'client_id' => $clientId,
            'project_id' => $projectId,
            'reference' => $reference,
            'status' => $status,
            'issued_at' => $issuedAt->toDateString(),
            'valid_until' => $validUntil->toDateString(),
            'notes' => $notes,
            'total_ht' => 0,
            'total_tax' => 0,
            'total_ttc' => 0,
        ]);

        $totals = $this->createLines($quote, $lines);
        $quote->update($totals);

        return $quote->fresh();
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $lines
     * @param  array<int, array{amount: float, paid_at: \Illuminate\Support\Carbon, method: PaymentMethod, reference: string, notes: string}>  $payments
     */
    private function seedInvoice(
        int $companyId,
        int $clientId,
        int $projectId,
        ?int $quoteId,
        string $reference,
        InvoiceStatus $status,
        \Illuminate\Support\Carbon $issuedAt,
        \Illuminate\Support\Carbon $dueDate,
        string $notes,
        array $lines,
        float $amountPaid,
        array $payments,
    ): Invoice {
        $invoice = Invoice::query()->create([
            'company_id' => $companyId,
            'client_id' => $clientId,
            'project_id' => $projectId,
            'quote_id' => $quoteId,
            'reference' => $reference,
            'status' => $status,
            'issued_at' => $issuedAt->toDateString(),
            'due_date' => $dueDate->toDateString(),
            'notes' => $notes,
            'total_ht' => 0,
            'total_tax' => 0,
            'total_ttc' => 0,
            'amount_paid' => 0,
            'balance_due' => 0,
        ]);

        $totals = $this->createInvoiceLines($invoice, $lines);
        $balanceDue = max(round($totals['total_ttc'] - $amountPaid, 2), 0);

        $invoice->update([
            ...$totals,
            'amount_paid' => $amountPaid,
            'balance_due' => $balanceDue,
            'status' => $status,
        ]);

        foreach ($payments as $payment) {
            Payment::query()->create([
                'invoice_id' => $invoice->id,
                'amount' => $payment['amount'],
                'paid_at' => $payment['paid_at']->toDateString(),
                'method' => $payment['method'],
                'reference' => $payment['reference'],
                'notes' => $payment['notes'],
            ]);
        }

        return $invoice->fresh();
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $lines
     * @return array{total_ht: float, total_tax: float, total_ttc: float}
     */
    private function createLines(Quote $quote, array $lines): array
    {
        $totalHt = 0.0;
        $totalTax = 0.0;
        $totalTtc = 0.0;

        foreach ($lines as $index => $line) {
            $lineTotals = $this->calculateLineTotals($line['quantity'], $line['unit_price_ht']);

            QuoteLine::query()->create([
                'quote_id' => $quote->id,
                'sort_order' => $index,
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price_ht' => $line['unit_price_ht'],
                'tax_rate' => self::TAX_RATE,
                ...$lineTotals,
            ]);

            $totalHt += $lineTotals['line_total_ht'];
            $totalTax += $lineTotals['line_total_tax'];
            $totalTtc += $lineTotals['line_total_ttc'];
        }

        return [
            'total_ht' => round($totalHt, 2),
            'total_tax' => round($totalTax, 2),
            'total_ttc' => round($totalTtc, 2),
        ];
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $lines
     * @return array{total_ht: float, total_tax: float, total_ttc: float}
     */
    private function createInvoiceLines(Invoice $invoice, array $lines): array
    {
        $totalHt = 0.0;
        $totalTax = 0.0;
        $totalTtc = 0.0;

        foreach ($lines as $index => $line) {
            $lineTotals = $this->calculateLineTotals($line['quantity'], $line['unit_price_ht']);

            InvoiceLine::query()->create([
                'invoice_id' => $invoice->id,
                'sort_order' => $index,
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price_ht' => $line['unit_price_ht'],
                'tax_rate' => self::TAX_RATE,
                ...$lineTotals,
            ]);

            $totalHt += $lineTotals['line_total_ht'];
            $totalTax += $lineTotals['line_total_tax'];
            $totalTtc += $lineTotals['line_total_ttc'];
        }

        return [
            'total_ht' => round($totalHt, 2),
            'total_tax' => round($totalTax, 2),
            'total_ttc' => round($totalTtc, 2),
        ];
    }

    /**
     * @return array{line_total_ht: float, line_total_tax: float, line_total_ttc: float}
     */
    private function calculateLineTotals(float|int $quantity, float $unitPriceHt): array
    {
        $lineTotalHt = round((float) $quantity * $unitPriceHt, 2);
        $lineTotalTax = round($lineTotalHt * (self::TAX_RATE / 100), 2);
        $lineTotalTtc = round($lineTotalHt + $lineTotalTax, 2);

        return [
            'line_total_ht' => $lineTotalHt,
            'line_total_tax' => $lineTotalTax,
            'line_total_ttc' => $lineTotalTtc,
        ];
    }

    private function seedAuditLogs(
        int $companyId,
        User $admin,
        Project $villaProject,
        Project $panoramiqueProject,
        Quote $quoteVilla,
    ): void {
        $entries = [
            [
                'action' => 'creation',
                'entity_type' => 'project',
                'entity_id' => $villaProject->id,
                'message' => 'Administrateur Système a créé le projet « Construction Villa Résidentielle — Lotissement California (Bâtiment) ».',
                'created_at' => now()->subMonths(7),
            ],
            [
                'action' => 'modification',
                'entity_type' => 'quote',
                'entity_id' => $quoteVilla->id,
                'message' => 'Administrateur Système a validé le devis DEVIS-2026-001 (Société Al Omrane Casablanca).',
                'created_at' => now()->subMonths(6),
            ],
            [
                'action' => 'creation',
                'entity_type' => 'project',
                'entity_id' => $panoramiqueProject->id,
                'message' => 'Administrateur Système a créé le projet « Aménagement du Boulevard Panoramique (VRD) ».',
                'created_at' => now()->subMonths(8),
            ],
            [
                'action' => 'creation',
                'entity_type' => 'invoice',
                'entity_id' => null,
                'message' => 'Administrateur Système a enregistré la facture FACT-2026-001 — 96 000 MAD (payée).',
                'created_at' => now()->subMonths(6)->addDays(2),
            ],
            [
                'action' => 'modification',
                'entity_type' => 'project',
                'entity_id' => $panoramiqueProject->id,
                'message' => 'Yassine Mansouri a mis à jour l\'avancement du lot Terrassement — Boulevard Panoramique.',
                'created_at' => now()->subWeeks(2),
            ],
        ];

        foreach ($entries as $entry) {
            AuditLog::query()->create([
                'company_id' => $companyId,
                'user_id' => $admin->id,
                'actor_label' => str_contains($entry['message'], 'Yassine') ? 'Yassine Mansouri' : 'Administrateur Système',
                ...$entry,
            ]);
        }
    }

    private function seedActivityLogs(
        int $companyId,
        User $admin,
        User $yassine,
        User $amine,
        Project $villaProject,
        Project $panoramiqueProject,
        Project $eclairageProject,
        Project $malabataProject,
        Project $palmeraieProject,
    ): void {
        $logs = [
            [
                'user_id' => $admin->id,
                'project_id' => $villaProject->id,
                'action_type' => 'created',
                'description' => 'Administrateur Système a créé le projet « '.$villaProject->title.' ».',
                'created_at' => now()->subMonths(7),
            ],
            [
                'user_id' => $yassine->id,
                'project_id' => $panoramiqueProject->id,
                'action_type' => 'updated',
                'description' => 'Yassine Mansouri a mis à jour l\'avancement du chantier Boulevard Panoramique.',
                'created_at' => now()->subWeeks(2),
            ],
            [
                'user_id' => $amine->id,
                'project_id' => $eclairageProject->id,
                'action_type' => 'updated',
                'description' => 'Amine Alami a validé la pose de 72 candélabres — Ain Chock.',
                'created_at' => now()->subDays(3),
            ],
            [
                'user_id' => $admin->id,
                'project_id' => $panoramiqueProject->id,
                'action_type' => 'created',
                'description' => 'Administrateur Système a créé le projet « '.$panoramiqueProject->title.' ».',
                'created_at' => now()->subMonths(8),
            ],
            [
                'user_id' => $yassine->id,
                'project_id' => $malabataProject->id,
                'action_type' => 'updated',
                'description' => 'Yassine Mansouri a validé la fin du terrassement littoral — Corniche Malabata.',
                'created_at' => now()->subWeeks(4),
            ],
            [
                'user_id' => $amine->id,
                'project_id' => $palmeraieProject->id,
                'action_type' => 'updated',
                'description' => 'Amine Alami a contrôlé le coulage dalle RDC — club house Palmeraie Golf.',
                'created_at' => now()->subDays(5),
            ],
            [
                'user_id' => $admin->id,
                'project_id' => $malabataProject->id,
                'action_type' => 'created',
                'description' => 'Administrateur Système a créé le projet « '.$malabataProject->title.' ».',
                'created_at' => now()->subMonths(4),
            ],
        ];

        foreach ($logs as $log) {
            ActivityLog::query()->create([
                'company_id' => $companyId,
                ...$log,
            ]);
        }
    }
}
