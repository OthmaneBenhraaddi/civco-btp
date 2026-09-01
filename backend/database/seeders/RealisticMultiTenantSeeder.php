<?php

namespace Database\Seeders;

use App\Enums\CompanyVisibility;
use App\Enums\ProjectStatus;
use App\Enums\TenantStatus;
use App\Enums\UserStatus;
use App\Models\Badge;
use App\Models\Client;
use App\Models\Company;
use App\Models\Project;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AdminCredentialService;
use App\Services\ThemeColorService;
use App\Support\MoroccoCityCoordinates;
use Database\Seeders\Concerns\SeedsFinancialDocuments;
use Database\Seeders\Concerns\SeedsProjectOperations;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RealisticMultiTenantSeeder extends Seeder
{
    use SeedsFinancialDocuments;
    use SeedsProjectOperations;

    private const PASSWORD = 'password';

    /** @var array<string, int> */
    private array $financialCounters = [];

    public function run(): void
    {
        DB::transaction(function (): void {
            $this->seedCivCo();
            $this->seedEebb();
            $this->seedAtlas();
        });
    }

    private function seedCivCo(): void
    {
        $ctx = $this->bootstrapTenant('civco', 'CivCo', [
            ['email' => 'admin@civco.ma', 'first' => 'Karim', 'last' => 'Benjelloun', 'job' => 'Administrateur', 'user_role' => 'admin', 'role_slug' => 'admin'],
            ['email' => 'compta@civco.ma', 'first' => 'Salma', 'last' => 'Idrissi', 'job' => 'Comptable', 'user_role' => 'user', 'role_slug' => 'accountant'],
            ['email' => 'chantier@civco.ma', 'first' => 'Yassine', 'last' => 'Mansouri', 'job' => 'Chef de chantier', 'user_role' => 'user', 'role_slug' => 'chef_chantier'],
            ['email' => 'ingenieur@civco.ma', 'first' => 'Amine', 'last' => 'Alami', 'job' => 'Ingénieur', 'user_role' => 'user', 'role_slug' => 'project_manager'],
            ['email' => 'tech@civco.ma', 'first' => 'Omar', 'last' => 'Tahiri', 'job' => 'Technicien', 'user_role' => 'user', 'role_slug' => 'collaborator'],
        ]);

        $badges = $this->seedBadges($ctx['company'], [
            'Gros Œuvre' => '#6366F1',
            'Second Œuvre' => '#0EA5E9',
            'Urgent' => '#EF4444',
            'Rénovation' => '#F59E0B',
        ]);

        $clients = [
            $this->seedClient($ctx, 'Société Al Omrane Casablanca', 'Karim Benjelloun', 'karim.benjelloun@alomrane.ma', 'Casablanca', ['Gros Œuvre', 'Urgent'], $badges),
            $this->seedClient($ctx, 'SJL Maghreb Transport', 'Sanaa Tazi', 's.tazi@sjl-maghreb.ma', 'Mohammedia', ['Second Œuvre'], $badges),
            $this->seedClient($ctx, 'Direction des Routes — Région Casa', 'Service Marchés', 'marches.public@routes.gov.ma', 'Rabat', ['Gros Œuvre', 'Urgent'], $badges),
            $this->seedClient($ctx, 'Palmeraie Golf Resort', 'Mehdi Bennani', 'm.bennani@palmeraie-golf.ma', 'Marrakech', ['Rénovation', 'Second Œuvre'], $badges),
        ];

        $this->seedProject($ctx, $clients[0], 'CIV-PRJ-001', 'Villa résidentielle — Lotissement California', ProjectStatus::InProgress, 'Gros Œuvre', 'Casablanca', 1_250_000, 62, [
            ['description' => 'Gros œuvre béton armé — 420 m² SDP', 'quantity' => 420, 'unit_price_ht' => 850],
            ['description' => 'Second œuvre menuiseries — forfait', 'quantity' => 1, 'unit_price_ht' => 185_000],
        ], [$ctx['users']['ingenieur@civco.ma'], $ctx['users']['chantier@civco.ma']]);

        $this->seedProject($ctx, $clients[0], 'CIV-PRJ-002', 'Résidence Anfa — rénovation façades', ProjectStatus::Completed, 'Rénovation', 'Casablanca', 680_000, 100, [
            ['description' => 'Rénovation façades ventilées — 2 800 m²', 'quantity' => 2_800, 'unit_price_ht' => 185],
        ], [$ctx['users']['tech@civco.ma']]);

        $this->seedProject($ctx, $clients[1], 'CIV-PRJ-003', 'Extension plateforme logistique Zenata', ProjectStatus::InProgress, 'Second Œuvre', 'Mohammedia', 920_000, 45, [
            ['description' => 'Dalle béton 3 200 m²', 'quantity' => 3_200, 'unit_price_ht' => 165],
            ['description' => 'Voirie d\'accès et éclairage', 'quantity' => 1, 'unit_price_ht' => 290_000],
        ], [$ctx['users']['chantier@civco.ma']]);

        $this->seedProject($ctx, $clients[2], 'CIV-PRJ-004', 'VRD Boulevard Panoramique — Mohammedia', ProjectStatus::Completed, 'Gros Œuvre', 'Mohammedia', 2_100_000, 100, [
            ['description' => 'Terrassement et plateforme — 12 000 m²', 'quantity' => 12_000, 'unit_price_ht' => 42],
            ['description' => 'Voirie et trottoirs — 1 200 ml', 'quantity' => 1_200, 'unit_price_ht' => 580],
        ], [$ctx['users']['ingenieur@civco.ma']]);

        $this->seedProject($ctx, $clients[2], 'CIV-PRJ-005', 'Éclairage public Ain Chock — phase 2', ProjectStatus::Cancelled, 'Urgent', 'Casablanca', 540_000, 15, [], [$ctx['users']['tech@civco.ma']]);

        $this->seedProject($ctx, $clients[3], 'CIV-PRJ-006', 'Club house Palmeraie — gros œuvre', ProjectStatus::InProgress, 'Gros Œuvre', 'Marrakech', 1_850_000, 58, [
            ['description' => 'Gros œuvre R+2 — 1 650 m² SDP', 'quantity' => 1_650, 'unit_price_ht' => 620],
            ['description' => 'Second œuvre spa & restaurant', 'quantity' => 1, 'unit_price_ht' => 420_000],
        ], [$ctx['users']['ingenieur@civco.ma'], $ctx['users']['chantier@civco.ma']]);
    }

    private function seedEebb(): void
    {
        $ctx = $this->bootstrapTenant('eebb', 'EEBB', [
            ['email' => 'admin@eebb.ma', 'first' => 'Nadia', 'last' => 'El Fassi', 'job' => 'Administrateur', 'user_role' => 'admin', 'role_slug' => 'admin'],
            ['email' => 'compta@eebb.ma', 'first' => 'Hassan', 'last' => 'Ouazzani', 'job' => 'Comptable', 'user_role' => 'user', 'role_slug' => 'accountant'],
            ['email' => 'chantier@eebb.ma', 'first' => 'Rachid', 'last' => 'Benkirane', 'job' => 'Chef de chantier', 'user_role' => 'user', 'role_slug' => 'chef_chantier'],
            ['email' => 'ing1@eebb.ma', 'first' => 'Laila', 'last' => 'Chraibi', 'job' => 'Ingénieur', 'user_role' => 'user', 'role_slug' => 'project_manager'],
            ['email' => 'ing2@eebb.ma', 'first' => 'Mehdi', 'last' => 'Ziani', 'job' => 'Ingénieur', 'user_role' => 'user', 'role_slug' => 'project_manager'],
            ['email' => 'tech1@eebb.ma', 'first' => 'Said', 'last' => 'Amrani', 'job' => 'Technicien', 'user_role' => 'user', 'role_slug' => 'collaborator'],
            ['email' => 'tech2@eebb.ma', 'first' => 'Imane', 'last' => 'Berrada', 'job' => 'Technicien', 'user_role' => 'user', 'role_slug' => 'collaborator'],
        ]);

        $badges = $this->seedBadges($ctx['company'], [
            'Gros Œuvre' => '#6366F1',
            'Second Œuvre' => '#0EA5E9',
            'Urgent' => '#EF4444',
            'Rénovation' => '#F59E0B',
            'Haute Visibilité' => '#A855F7',
            'Norme HQE' => '#10B981',
            'Litige Client' => '#F97316',
        ]);

        $clients = [
            $this->seedClient($ctx, 'APDN — Agence Nord', 'Nadia El Fassi', 'contact@apdn.ma', 'Tanger', ['Haute Visibilité', 'Norme HQE'], $badges),
            $this->seedClient($ctx, 'ONCF — Division Infrastructures', 'Karim Saadi', 'infra@oncf.ma', 'Rabat', ['Gros Œuvre', 'Urgent'], $badges),
            $this->seedClient($ctx, 'Marjane Holding', 'Fatima Zahra', 'travaux@marjane.ma', 'Casablanca', ['Second Œuvre', 'Rénovation'], $badges),
            $this->seedClient($ctx, 'Régie Autonome Tanger', 'Youssef Kadiri', 'voirie@rat.ma', 'Tanger', ['Haute Visibilité', 'Litige Client'], $badges),
            $this->seedClient($ctx, 'Université Abdelmalek Essaâdi', 'Dr. Bouchra', 'travaux@uae.ac.ma', 'Tétouan', ['Norme HQE', 'Gros Œuvre'], $badges),
        ];

        $this->seedProject($ctx, $clients[0], 'EEB-PRJ-001', 'Promenade Corniche Malabata', ProjectStatus::InProgress, 'Haute Visibilité', 'Tanger', 3_200_000, 55, [
            ['description' => 'Terrassement littoral — 6 500 m³', 'quantity' => 6_500, 'unit_price_ht' => 38],
            ['description' => 'Promenade pierre naturelle — 900 ml', 'quantity' => 900, 'unit_price_ht' => 520],
        ], [$ctx['users']['ing1@eebb.ma'], $ctx['users']['chantier@eebb.ma']]);

        $this->seedProject($ctx, $clients[0], 'EEB-PRJ-002', 'Éclairage LED Corniche — tranche 1', ProjectStatus::Completed, 'Norme HQE', 'Tanger', 890_000, 100, [
            ['description' => 'Candélabres LED basse consommation — 85 unités', 'quantity' => 85, 'unit_price_ht' => 4_800],
        ], [$ctx['users']['tech1@eebb.ma']]);

        $this->seedProject($ctx, $clients[1], 'EEB-PRJ-003', 'Gare TGV Tanger — voiries d\'accès', ProjectStatus::InProgress, 'Gros Œuvre', 'Tanger', 4_500_000, 38, [
            ['description' => 'Plateforme voirie — 8 500 m²', 'quantity' => 8_500, 'unit_price_ht' => 195],
            ['description' => 'Réseaux EP/EU — forfait', 'quantity' => 1, 'unit_price_ht' => 720_000],
        ], [$ctx['users']['ing2@eebb.ma']]);

        $this->seedProject($ctx, $clients[2], 'EEB-PRJ-004', 'Rénovation hypermarket Marjane Salé', ProjectStatus::Completed, 'Rénovation', 'Salé', 1_120_000, 100, [
            ['description' => 'Second œuvre intérieur — 4 200 m²', 'quantity' => 4_200, 'unit_price_ht' => 145],
        ], [$ctx['users']['tech2@eebb.ma']]);

        $this->seedProject($ctx, $clients[2], 'EEB-PRJ-005', 'Extension parking couvert — Berrechid', ProjectStatus::Cancelled, 'Second Œuvre', 'Berrechid', 760_000, 8, [], [$ctx['users']['tech1@eebb.ma']]);

        $this->seedProject($ctx, $clients[3], 'EEB-PRJ-006', 'Requalification place du 9 Avril', ProjectStatus::InProgress, 'Litige Client', 'Tanger', 2_400_000, 42, [
            ['description' => 'Aménagement pavés et mobilier urbain', 'quantity' => 1, 'unit_price_ht' => 980_000],
            ['description' => 'Fontaines et éclairage scénique', 'quantity' => 1, 'unit_price_ht' => 420_000],
        ], [$ctx['users']['ing1@eebb.ma']]);

        $this->seedProject($ctx, $clients[4], 'EEB-PRJ-007', 'Campus universitaire — bâtiment B', ProjectStatus::InProgress, 'Norme HQE', 'Tétouan', 5_600_000, 28, [
            ['description' => 'Gros œuvre R+3 — 3 800 m² SDP', 'quantity' => 3_800, 'unit_price_ht' => 720],
            ['description' => 'Isolation thermique HQE — forfait', 'quantity' => 1, 'unit_price_ht' => 540_000],
        ], [$ctx['users']['ing2@eebb.ma'], $ctx['users']['chantier@eebb.ma']]);

        $this->seedProject($ctx, $clients[4], 'EEB-PRJ-008', 'Parking étudiants — phase provisoire', ProjectStatus::Completed, 'Gros Œuvre', 'Tétouan', 420_000, 100, [
            ['description' => 'Plateforme stabilisée — 2 100 m²', 'quantity' => 2_100, 'unit_price_ht' => 95],
        ], [$ctx['users']['tech2@eebb.ma']]);
    }

    private function seedAtlas(): void
    {
        $ctx = $this->bootstrapTenant('atlas', 'Atlas Construction', [
            ['email' => 'admin@atlas.ma', 'first' => 'Samira', 'last' => 'Bennani', 'job' => 'Administrateur', 'user_role' => 'admin', 'role_slug' => 'admin'],
            ['email' => 'compta@atlas.ma', 'first' => 'Khalid', 'last' => 'Mouline', 'job' => 'Comptable', 'user_role' => 'user', 'role_slug' => 'accountant'],
            ['email' => 'eco@atlas.ma', 'first' => 'Driss', 'last' => 'Hamdaoui', 'job' => 'Ingénieur Éco-conception', 'user_role' => 'user', 'role_slug' => 'project_manager'],
            ['email' => 'tech@atlas.ma', 'first' => 'Amina', 'last' => 'Rguibi', 'job' => 'Technicien', 'user_role' => 'user', 'role_slug' => 'collaborator'],
        ]);

        $badges = $this->seedBadges($ctx['company'], [
            'Isolation Bio' => '#22C55E',
            'Solaire' => '#EAB308',
            'Audit Énergétique' => '#06B6D4',
            'Validé HQE' => '#8B5CF6',
        ]);

        $clients = [
            $this->seedClient($ctx, 'Green Villa Marrakech', 'Lucas Martin', 'contact@greenvilla.ma', 'Marrakech', ['Isolation Bio', 'Validé HQE'], $badges),
            $this->seedClient($ctx, 'SunPower Maroc', 'Ibrahim Naciri', 'projets@sunpower.ma', 'Agadir', ['Solaire', 'Audit Énergétique'], $badges),
            $this->seedClient($ctx, 'Résidence Les Oliviers — Copropriété', 'Claire Dupont', 'syndic@oliviers.ma', 'Essaouira', ['Isolation Bio', 'Solaire'], $badges),
        ];

        $this->seedProject($ctx, $clients[0], 'ATL-PRJ-001', 'Villa bioclimatique — Palmeraie', ProjectStatus::InProgress, 'Isolation Bio', 'Marrakech', 2_800_000, 52, [
            ['description' => 'Isolation laine de bois — 680 m²', 'quantity' => 680, 'unit_price_ht' => 420],
            ['description' => 'Menuiseries triple vitrage HQE', 'quantity' => 1, 'unit_price_ht' => 385_000],
        ], [$ctx['users']['eco@atlas.ma'], $ctx['users']['tech@atlas.ma']]);

        $this->seedProject($ctx, $clients[0], 'ATL-PRJ-002', 'Audit énergétique post-livraison', ProjectStatus::Completed, 'Audit Énergétique', 'Marrakech', 85_000, 100, [
            ['description' => 'Audit RT2012 + recommandations', 'quantity' => 1, 'unit_price_ht' => 65_000],
        ], [$ctx['users']['eco@atlas.ma']]);

        $this->seedProject($ctx, $clients[1], 'ATL-PRJ-003', 'Centrale solaire 250 kWc — zone industrielle', ProjectStatus::InProgress, 'Solaire', 'Agadir', 3_400_000, 65, [
            ['description' => 'Panneaux photovoltaïques 250 kWc', 'quantity' => 250, 'unit_price_ht' => 8_500],
            ['description' => 'Onduleurs et raccordement', 'quantity' => 1, 'unit_price_ht' => 420_000],
        ], [$ctx['users']['eco@atlas.ma'], $ctx['users']['tech@atlas.ma']]);

        $this->seedProject($ctx, $clients[1], 'ATL-PRJ-004', 'Étude de faisabilité solaire — extension', ProjectStatus::Cancelled, 'Audit Énergétique', 'Agadir', 120_000, 0, [], [$ctx['users']['eco@atlas.ma']]);

        $this->seedProject($ctx, $clients[2], 'ATL-PRJ-005', 'Rénovation énergétique 24 logements', ProjectStatus::InProgress, 'Validé HQE', 'Essaouira', 1_650_000, 40, [
            ['description' => 'Isolation combles — 1 200 m²', 'quantity' => 1_200, 'unit_price_ht' => 185],
            ['description' => 'Pompe à chaleur collective', 'quantity' => 1, 'unit_price_ht' => 290_000],
        ], [$ctx['users']['tech@atlas.ma']]);

        $this->seedProject($ctx, $clients[2], 'ATL-PRJ-006', 'Installation solaire copropriété — toiture', ProjectStatus::Completed, 'Solaire', 'Essaouira', 540_000, 100, [
            ['description' => 'Kit solaire 45 kWc + autoconsommation', 'quantity' => 1, 'unit_price_ht' => 420_000],
        ], [$ctx['users']['eco@atlas.ma']]);
    }

    /**
     * @param  array<int, array{email: string, first: string, last: string, job: string, user_role: string, role_slug: string}>  $team
     * @return array{tenant: Tenant, company: Company, users: array<string, User>}
     */
    private function bootstrapTenant(string $subdomain, string $name, array $team): array
    {
        $tenant = Tenant::query()->create([
            'name' => $name,
            'subdomain' => $subdomain,
            'status' => TenantStatus::Active,
        ]);

        $company = Company::query()->create([
            'name' => $name,
            'legal_name' => $name.' SARL',
            'siret' => str_pad(substr(hash('crc32b', $subdomain), 0, 10), 14, '0', STR_PAD_LEFT),
            'visibility' => CompanyVisibility::Private,
            'email' => "contact@{$subdomain}.ma",
            'phone' => '+212 522 000 000',
            'city' => 'Casablanca',
            'country' => 'MA',
            'is_active' => true,
        ]);

        app(ThemeColorService::class)->seedDefaultsForCompany($company->id);

        $credentialService = app(AdminCredentialService::class);
        $users = [];

        foreach ($team as $member) {
            $users[$member['email']] = $this->createTeamMember(
                $tenant,
                $company,
                $this->uniqueTeamEmail($member['email'], $subdomain),
                $member['first'],
                $member['last'],
                $member['job'],
                $member['user_role'],
                $member['role_slug'],
                $credentialService,
            );
        }

        return compact('tenant', 'company', 'users');
    }

    private function createTeamMember(
        Tenant $tenant,
        Company $company,
        string $email,
        string $firstName,
        string $lastName,
        string $jobTitle,
        string $userRole,
        string $roleSlug,
        AdminCredentialService $credentialService,
    ): User {
        $role = Role::query()
            ->whereNull('company_id')
            ->where('slug', $roleSlug)
            ->firstOrFail();

        $user = User::query()->create([
            'tenant_id' => $tenant->id,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => '+212 6'.random_int(10, 99).' '.random_int(100, 999).' '.random_int(100, 999),
            'password' => Hash::make(self::PASSWORD),
            'is_active' => true,
            'status' => UserStatus::Active,
            'role' => $userRole,
            'job_title' => $jobTitle,
            'email_verified_at' => now(),
        ]);

        $company->users()->attach($user->id, [
            'is_primary' => true,
            'joined_at' => now()->subMonths(6)->toDateString(),
        ]);

        $user->roles()->sync([
            $role->id => ['company_id' => $company->id],
        ]);

        $credentialService->storeProvisionedPassword($user, self::PASSWORD);

        return $user;
    }

    private function uniqueTeamEmail(string $email, string $subdomain): string
    {
        if (! User::query()->where('email', $email)->exists()) {
            return $email;
        }

        $local = strstr($email, '@', true) ?: $email;
        $domain = substr(strstr($email, '@') ?: '@civco.ma', 1);
        $fallback = "{$local}.{$subdomain}@{$domain}";

        if (! User::query()->where('email', $fallback)->exists()) {
            return $fallback;
        }

        return $local.'+'.$subdomain.'.'.uniqid().'@'.$domain;
    }

    /**
     * @param  array<string, string>  $definitions  name => color
     * @return array<string, Badge>
     */
    private function seedBadges(Company $company, array $definitions): array
    {
        $badges = [];

        foreach ($definitions as $name => $color) {
            $badges[$name] = Badge::query()->create([
                'company_id' => $company->id,
                'name' => $name,
                'color' => $color,
                'type' => 'client',
            ]);
        }

        return $badges;
    }

    /**
     * @param  array<string, Badge>  $badges
     * @param  list<string>  $badgeNames
     */
    private function seedClient(
        array $ctx,
        string $name,
        string $contactName,
        string $email,
        string $city,
        array $badgeNames,
        array $badges,
    ): Client {
        $client = Client::query()->create([
            'tenant_id' => $ctx['tenant']->id,
            'company_id' => $ctx['company']->id,
            'name' => $name,
            'contact_name' => $contactName,
            'email' => $email,
            'phone' => '+212 6'.random_int(10, 99).' '.random_int(100, 999).' '.random_int(100, 999),
            'address_line1' => 'Zone industrielle, Lot '.random_int(1, 48),
            'postal_code' => '20000',
            'city' => $city,
            'country' => 'MA',
            'notes' => 'Client seed — '.$ctx['tenant']->name,
            'is_active' => true,
            'client_role_slug' => 'client_extern',
        ]);

        $badgeIds = array_values(array_filter(array_map(
            fn (string $badgeName) => $badges[$badgeName]->id ?? null,
            $badgeNames,
        )));

        if ($badgeIds !== []) {
            $client->badges()->sync($badgeIds);
        }

        return $client;
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $quoteLines
     * @param  array<int, User>  $teamMembers
     */
    private function seedProject(
        array $ctx,
        Client $client,
        string $reference,
        string $title,
        ProjectStatus $status,
        string $badgeLabel,
        string $city,
        float $budget,
        float $progress,
        array $quoteLines,
        array $teamMembers,
    ): Project {
        $coords = MoroccoCityCoordinates::resolve($city);

        $project = Project::query()->create([
            'tenant_id' => $ctx['tenant']->id,
            'company_id' => $ctx['company']->id,
            'client_id' => $client->id,
            'reference' => $reference,
            'title' => $title,
            'description' => "Chantier tagué « {$badgeLabel} » — {$ctx['tenant']->name}.",
            'status' => $status,
            'nature' => 'BÂTIMENT',
            'sector' => str_contains(strtolower($client->name), 'direction') || str_contains(strtolower($client->name), 'université') || str_contains(strtolower($client->name), 'oncf') || str_contains(strtolower($client->name), 'régie') ? 'PUBLIC' : 'PRIVÉ',
            'etat_paiement' => $status === ProjectStatus::Completed ? 'PAYÉ' : 'NON PAYÉ',
            'avancement' => $progress >= 100 ? 'Terminé' : ($progress > 0 ? 'En cours' : 'Non démarré'),
            'start_date' => now()->subMonths(8)->toDateString(),
            'end_date' => now()->addMonths(4)->toDateString(),
            'budget' => $budget,
            'progress_percent' => $progress,
            'site_city' => $city,
            'site_address_line1' => 'Chantier — '.$city,
            'latitude' => $coords['lat'] ?? null,
            'longitude' => $coords['lon'] ?? null,
        ]);

        foreach ($teamMembers as $member) {
            $project->teamMembers()->syncWithoutDetaching([
                $member->id => [
                    'role_label' => $member->job_title ?? 'Intervenant',
                    'assigned_at' => now()->subMonths(3)->toDateString(),
                ],
            ]);
        }

        $assignee = $teamMembers[0] ?? $ctx['users'][array_key_first($ctx['users'])];
        $this->seedProjectPhases($project, $assignee, $status);

        if ($quoteLines !== []) {
            $refPrefix = strtoupper(explode('-', $reference)[0]);
            $this->financialCounters[$refPrefix] = ($this->financialCounters[$refPrefix] ?? 0) + 1;

            $financials = $this->seedFinancialsForActiveProject(
                $ctx['tenant']->id,
                $ctx['company']->id,
                $client->id,
                $project->id,
                $refPrefix,
                $this->financialCounters[$refPrefix],
                $status,
                $quoteLines,
                $title,
            );

            if ($financials !== null) {
                $this->seedLogisticsChain(
                    $ctx['tenant']->id,
                    $ctx['company']->id,
                    $client->id,
                    $project,
                    $financials['quote'],
                    $refPrefix,
                    $status,
                );
            }
        }

        return $project;
    }
}
