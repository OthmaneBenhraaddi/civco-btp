<?php

namespace Database\Seeders;

use App\Enums\ContactRole;
use App\Enums\ExpenseCategory;
use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\ProjectStatus;
use App\Enums\QuoteStatus;
use App\Enums\TaskStatus;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\ClientContact;
use App\Models\Company;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Lot;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Quote;
use App\Models\Sector;
use App\Models\QuoteLine;
use App\Models\Payment;
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
        $teamMember = User::query()->where('email', 'user@btpdemo.fr')->first();

        if ($company === null || $admin === null) {
            return;
        }

        DB::transaction(function () use ($company, $admin, $teamMember): void {
            $adamZakin = Client::query()->updateOrCreate(
                ['company_id' => $company->id, 'email' => 'adam.zakin@gmail.com'],
                [
                    'name' => 'Adam Zakin',
                    'contact_name' => 'Adam Zakin',
                    'phone' => '+212 661 234 567',
                    'address_line1' => 'Résidence Al Amal, Apt 12',
                    'postal_code' => '20250',
                    'city' => 'Casablanca',
                    'country' => 'MA',
                    'notes' => 'Client particulier — promoteur immobilier privé.',
                    'is_active' => true,
                    'client_role_slug' => 'client_extern',
                ],
            );

            $publicClient = Client::query()->updateOrCreate(
                ['company_id' => $company->id, 'email' => 'marche.public@routes.gov.ma'],
                [
                    'name' => 'Direction des Routes — Ministère de l\'Équipement',
                    'contact_name' => 'M. Karim Benali — Chef de division VRD',
                    'phone' => '+212 537 789 012',
                    'address_line1' => 'Avenue Annakhil, Hay Riad',
                    'postal_code' => '10000',
                    'city' => 'Rabat',
                    'country' => 'MA',
                    'notes' => 'Maître d\'ouvrage public — marchés de voirie et aménagement urbain.',
                    'is_active' => true,
                    'client_role_slug' => 'client_extern',
                ],
            );

            ClientContact::query()->updateOrCreate(
                ['client_id' => $adamZakin->id, 'email' => 'adam.zakin@gmail.com'],
                [
                    'name' => 'Adam Zakin',
                    'phone' => '+212 661 234 567',
                    'contact_role' => ContactRole::Commercial,
                ],
            );

            ClientContact::query()->updateOrCreate(
                ['client_id' => $adamZakin->id, 'email' => 'compta@zakin-promo.ma'],
                [
                    'name' => 'Sara El Amrani',
                    'phone' => '+212 661 234 568',
                    'contact_role' => ContactRole::Comptable,
                ],
            );

            ClientContact::query()->updateOrCreate(
                ['client_id' => $publicClient->id, 'email' => 'k.benali@routes.gov.ma'],
                [
                    'name' => 'M. Karim Benali',
                    'phone' => '+212 537 789 012',
                    'contact_role' => ContactRole::ChefDeProjet,
                ],
            );

            ClientContact::query()->updateOrCreate(
                ['client_id' => $publicClient->id, 'email' => 'marche.public@routes.gov.ma'],
                [
                    'name' => 'Service Marchés Publics',
                    'phone' => '+212 537 789 100',
                    'contact_role' => ContactRole::Commercial,
                ],
            );

            $residenceProject = Project::query()->updateOrCreate(
                ['company_id' => $company->id, 'reference' => 'PRJ-2026-001'],
                [
                    'client_id' => $adamZakin->id,
                    'title' => 'Construction d\'une Résidence R+4 (Privé — Bâtiment)',
                    'description' => 'Construction d\'une résidence R+4 comprenant 16 appartements, parking sous-sol et locaux commerciaux au RDC. Quartier Anfa, Casablanca.',
                    'status' => ProjectStatus::InProgress,
                    'nature' => 'BÂTIMENT',
                    'sector' => 'PRIVÉ',
                    'etat_paiement' => 'NON PAYÉ',
                    'delais' => '14 mois — livraison prévue T4 2026',
                    'avancement' => 'Gros œuvre en cours — dalle RDC coulée',
                    'start_date' => now()->subMonths(4)->toDateString(),
                    'end_date' => now()->addMonths(10)->toDateString(),
                    'actual_start_date' => now()->subMonths(3)->toDateString(),
                    'budget' => 8_500_000.00,
                    'progress_percent' => 42.00,
                    'site_address_line1' => 'Boulevard de la Corniche, Anfa',
                    'site_city' => 'Casablanca',
                    'site_postal_code' => '20000',
                    'site_address' => 'Boulevard de la Corniche, Anfa, 20000 Casablanca',
                    'latitude' => 33.5731000,
                    'longitude' => -7.6598000,
                ],
            );

            $vrdProject = Project::query()->updateOrCreate(
                ['company_id' => $company->id, 'reference' => 'PRJ-2026-002'],
                [
                    'client_id' => $publicClient->id,
                    'title' => 'Aménagement de Voie Urbaine et VRD (Public — VRD)',
                    'description' => 'Aménagement de 2,4 km de voie urbaine : terrassement, couche de base, bordures, trottoirs, réseaux EP/EU et éclairage public — commune de Médiouna.',
                    'status' => ProjectStatus::InProgress,
                    'nature' => 'VRD',
                    'sector' => 'PUBLIC',
                    'etat_paiement' => 'NON PAYÉ',
                    'delais' => '18 mois — marché public N° VRD/MED/2025',
                    'avancement' => 'Terrassement général achevé à 65 %',
                    'start_date' => now()->subMonths(2)->toDateString(),
                    'end_date' => now()->addMonths(16)->toDateString(),
                    'actual_start_date' => now()->subMonths(2)->toDateString(),
                    'budget' => 18_500_000.00,
                    'progress_percent' => 28.00,
                    'site_address_line1' => 'Route Provinciale RP 3001',
                    'site_city' => 'Médiouna',
                    'site_postal_code' => '28650',
                    'site_address' => 'Route Provinciale RP 3001, 28650 Médiouna',
                    'latitude' => 33.4547000,
                    'longitude' => -7.5143000,
                ],
            );

            foreach ([
                [$residenceProject, 'BÂTIMENT', ['Gros Œuvre', 'Second Œuvre', 'Finitions']],
                [$vrdProject, 'VRD', ['Terrassement', 'Voirie', 'Réseaux divers']],
            ] as [$project, $sectorName, $lotNames]) {
                $sector = Sector::query()->firstOrCreate(
                    ['company_id' => $company->id, 'name' => $sectorName],
                );

                $lotIds = collect($lotNames)->map(function (string $name) use ($company, $sector): int {
                    return Lot::query()->firstOrCreate(
                        [
                            'company_id' => $company->id,
                            'name' => $name,
                        ],
                        ['sector_id' => $sector->id],
                    )->id;
                })->all();

                $project->lots()->sync($lotIds);
            }

            $residenceProject->teamMembers()->syncWithoutDetaching([
                $admin->id => [
                    'role_label' => 'Conducteur de travaux',
                    'assigned_at' => now()->subMonths(3)->toDateString(),
                ],
            ]);

            $vrdProject->teamMembers()->syncWithoutDetaching([
                $admin->id => [
                    'role_label' => 'Chef de chantier VRD',
                    'assigned_at' => now()->subMonths(2)->toDateString(),
                ],
            ]);

            if ($teamMember !== null) {
                $residenceProject->teamMembers()->syncWithoutDetaching([
                    $teamMember->id => [
                        'role_label' => 'Technicien chantier',
                        'assigned_at' => now()->subMonth()->toDateString(),
                    ],
                ]);
            }

            $this->seedPhasesAndTasks($residenceProject, $admin, [
                [
                    'name' => 'Gros Œuvre',
                    'sort_order' => 0,
                    'progress_percent' => 55.00,
                    'planned_start_date' => now()->subMonths(3),
                    'planned_end_date' => now()->addMonths(4),
                    'tasks' => [
                        ['title' => 'Fouille en excavation', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                        ['title' => 'Coulage de la dalle RDC', 'status' => TaskStatus::InProgress, 'progress_percent' => 75],
                        ['title' => 'Élévation des murs R+1 à R+4', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
                [
                    'name' => 'Second Œuvre',
                    'sort_order' => 1,
                    'progress_percent' => 10.00,
                    'planned_start_date' => now()->addMonths(2),
                    'planned_end_date' => now()->addMonths(7),
                    'tasks' => [
                        ['title' => 'Cloisonnement et doublages', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                        ['title' => 'Installation électrique encastrée', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
                [
                    'name' => 'Finitions',
                    'sort_order' => 2,
                    'progress_percent' => 0.00,
                    'planned_start_date' => now()->addMonths(7),
                    'planned_end_date' => now()->addMonths(10),
                    'tasks' => [
                        ['title' => 'Peinture intérieure et enduits', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                        ['title' => 'Pose des menuiseries aluminium', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
            ]);

            $this->seedPhasesAndTasks($vrdProject, $admin, [
                [
                    'name' => 'Terrassement',
                    'sort_order' => 0,
                    'progress_percent' => 65.00,
                    'planned_start_date' => now()->subMonths(2),
                    'planned_end_date' => now()->addMonth(),
                    'tasks' => [
                        ['title' => 'Décapage de la couche végétale', 'status' => TaskStatus::Done, 'progress_percent' => 100],
                        ['title' => 'Fouille en tranchées réseaux', 'status' => TaskStatus::InProgress, 'progress_percent' => 60],
                    ],
                ],
                [
                    'name' => 'Voirie',
                    'sort_order' => 1,
                    'progress_percent' => 15.00,
                    'planned_start_date' => now()->addMonth(),
                    'planned_end_date' => now()->addMonths(8),
                    'tasks' => [
                        ['title' => 'Mise en place de la couche de base GNB', 'status' => TaskStatus::InProgress, 'progress_percent' => 30],
                        ['title' => 'Pose des bordures de trottoir', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
                [
                    'name' => 'Réseaux divers',
                    'sort_order' => 2,
                    'progress_percent' => 5.00,
                    'planned_start_date' => now()->addMonths(3),
                    'planned_end_date' => now()->addMonths(12),
                    'tasks' => [
                        ['title' => 'Pose canalisation eaux pluviales Ø400', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                        ['title' => 'Pose regard de visite béton RM30', 'status' => TaskStatus::Todo, 'progress_percent' => 0],
                    ],
                ],
            ]);

            $quoteAccepted = $this->seedQuote(
                $company->id,
                $adamZakin->id,
                $residenceProject->id,
                'DEVIS-2026-001',
                QuoteStatus::Accepted,
                now()->subMonths(3),
                now()->addMonth(),
                'Devis gros œuvre — Résidence R+4 Anfa. Validé par le client.',
                [
                    ['description' => 'Terrassement et fondations — 450 m³', 'quantity' => 450, 'unit_price_ht' => 850],
                    ['description' => 'Béton armé dalle RDC — 280 m³', 'quantity' => 280, 'unit_price_ht' => 1200],
                    ['description' => 'Maçonnerie élévation R+1 à R+4 — forfait', 'quantity' => 1, 'unit_price_ht' => 1_850_000],
                ],
            );

            $quotePending = $this->seedQuote(
                $company->id,
                $publicClient->id,
                $vrdProject->id,
                'DEVIS-2026-002',
                QuoteStatus::Sent,
                now()->subWeeks(2),
                now()->addWeeks(4),
                'Devis marché public VRD — en attente de validation MOA.',
                [
                    ['description' => 'Terrassement général — 15 000 m²', 'quantity' => 15_000, 'unit_price_ht' => 45],
                    ['description' => 'Couche de base GNB — 12 000 m²', 'quantity' => 12_000, 'unit_price_ht' => 95],
                    ['description' => 'Bordures et trottoirs — 3 500 ml', 'quantity' => 3_500, 'unit_price_ht' => 180],
                ],
            );

            $this->seedQuote(
                $company->id,
                $adamZakin->id,
                $residenceProject->id,
                'DEVIS-2026-003',
                QuoteStatus::Sent,
                now()->subDays(5),
                now()->addMonths(1),
                'Devis complémentaire — menuiseries aluminium et peinture.',
                [
                    ['description' => 'Menuiseries aluminium anodisé — 16 logements', 'quantity' => 16, 'unit_price_ht' => 28_500],
                    ['description' => 'Peinture intérieure — 3 200 m²', 'quantity' => 3_200, 'unit_price_ht' => 65],
                ],
            );

            $this->seedInvoice(
                $company->id,
                $adamZakin->id,
                $residenceProject->id,
                $quoteAccepted->id,
                'FACT-2026-001',
                InvoiceStatus::Paid,
                now()->subMonths(2),
                now()->subMonth(),
                'Acompte 30 % — démarrage gros œuvre Résidence R+4.',
                [
                    ['description' => 'Acompte travaux de gros œuvre — tranche 1', 'quantity' => 1, 'unit_price_ht' => 850_000],
                ],
                amountPaid: 1_020_000.00,
                payments: [
                    [
                        'amount' => 1_020_000.00,
                        'paid_at' => now()->subMonths(2),
                        'method' => PaymentMethod::BankTransfer,
                        'reference' => 'VIR-ADZ-2026-0142',
                        'notes' => 'Virement client Adam Zakin — acompte 30 %',
                    ],
                ],
            );

            $this->seedInvoice(
                $company->id,
                $publicClient->id,
                $vrdProject->id,
                $quotePending->id,
                'FACT-2026-002',
                InvoiceStatus::PartiallyPaid,
                now()->subMonth(),
                now()->addDays(15),
                'Facture tranche 1 — terrassement et préparation plateforme VRD Médiouna.',
                [
                    ['description' => 'Tranche 1 — terrassement et plateforme (60 % du lot)', 'quantity' => 1, 'unit_price_ht' => 1_500_000],
                ],
                amountPaid: 1_080_000.00,
                payments: [
                    [
                        'amount' => 1_080_000.00,
                        'paid_at' => now()->subWeeks(3),
                        'method' => PaymentMethod::BankTransfer,
                        'reference' => 'MANDAT-MO-2026-0087',
                        'notes' => 'Mandat administratif — tranche 1 (60 %)',
                    ],
                ],
            );

            $this->seedInvoice(
                $company->id,
                $publicClient->id,
                $vrdProject->id,
                null,
                'FACT-2026-003',
                InvoiceStatus::Sent,
                now()->subWeeks(2),
                now()->addWeeks(2),
                'Facture travaux de voirie — en attente de règlement MOA.',
                [
                    ['description' => 'Fourniture et pose bordures — 800 ml', 'quantity' => 800, 'unit_price_ht' => 180],
                    ['description' => 'Couche de roulement BB — 2 000 m²', 'quantity' => 2_000, 'unit_price_ht' => 120],
                ],
                amountPaid: 0.00,
                payments: [],
            );

            Expense::query()->updateOrCreate(
                ['project_id' => $residenceProject->id, 'label' => 'Achat ciment CPJ45 — 120 tonnes'],
                [
                    'recorded_by_user_id' => $admin->id,
                    'category' => ExpenseCategory::Materials,
                    'amount' => 185_000.00,
                    'expense_date' => now()->subWeeks(3)->toDateString(),
                    'notes' => 'Livraison Lafarge Casablanca — lot gros œuvre',
                ],
            );

            Expense::query()->updateOrCreate(
                ['project_id' => $residenceProject->id, 'label' => 'Location grue à tour — 1 mois'],
                [
                    'recorded_by_user_id' => $admin->id,
                    'category' => ExpenseCategory::Equipment,
                    'amount' => 95_000.00,
                    'expense_date' => now()->subWeeks(2)->toDateString(),
                    'notes' => 'Manitowac 8 t — élévation R+1',
                ],
            );

            Expense::query()->updateOrCreate(
                ['project_id' => $vrdProject->id, 'label' => 'Location engins terrassement — 15 jours'],
                [
                    'recorded_by_user_id' => $admin->id,
                    'category' => ExpenseCategory::Equipment,
                    'amount' => 320_000.00,
                    'expense_date' => now()->subMonth()->toDateString(),
                    'notes' => 'Pelle 20 t + compacteur — tranche terrassement',
                ],
            );

            $this->seedAuditLogs($company->id, $admin, $residenceProject, $vrdProject, $quoteAccepted);
        });
    }

    /**
     * @param  array<int, array{name: string, sort_order: int, progress_percent: float, planned_start_date: \Illuminate\Support\Carbon, planned_end_date: \Illuminate\Support\Carbon, tasks: array<int, array{title: string, status: TaskStatus, progress_percent: int}>}>  $phases
     */
    private function seedPhasesAndTasks(Project $project, User $admin, array $phases): void
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
                    'assigned_to_user_id' => $admin->id,
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
        $quote = Quote::query()->updateOrCreate(
            ['company_id' => $companyId, 'reference' => $reference],
            [
                'client_id' => $clientId,
                'project_id' => $projectId,
                'status' => $status,
                'issued_at' => $issuedAt->toDateString(),
                'valid_until' => $validUntil->toDateString(),
                'notes' => $notes,
                'total_ht' => 0,
                'total_tax' => 0,
                'total_ttc' => 0,
            ],
        );

        $quote->lines()->delete();
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
        $invoice = Invoice::query()->updateOrCreate(
            ['company_id' => $companyId, 'reference' => $reference],
            [
                'client_id' => $clientId,
                'project_id' => $projectId,
                'quote_id' => $quoteId,
                'status' => $status,
                'issued_at' => $issuedAt->toDateString(),
                'due_date' => $dueDate->toDateString(),
                'notes' => $notes,
                'total_ht' => 0,
                'total_tax' => 0,
                'total_ttc' => 0,
                'amount_paid' => 0,
                'balance_due' => 0,
            ],
        );

        $invoice->payments()->delete();
        $invoice->lines()->delete();

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
        Project $residenceProject,
        Project $vrdProject,
        Quote $quoteAccepted,
    ): void {
        AuditLog::query()
            ->where('company_id', $companyId)
            ->whereIn('message', [
                'Administrateur Système a créé le projet « Construction d\'une Résidence R+4 (Privé — Bâtiment) ».',
                'Administrateur Système a validé le devis DEVIS-2026-001 (client Adam Zakin).',
                'Administrateur Système a créé le projet « Aménagement de Voie Urbaine et VRD (Public — VRD) ».',
                'Administrateur Système a enregistré la facture FACT-2026-001 — 1 020 000 MAD (payée).',
                'Administrateur Système a mis à jour l\'avancement du lot Terrassement — projet VRD Médiouna.',
            ])
            ->delete();

        $entries = [
            [
                'action' => 'creation',
                'entity_type' => 'project',
                'entity_id' => $residenceProject->id,
                'message' => 'Administrateur Système a créé le projet « Construction d\'une Résidence R+4 (Privé — Bâtiment) ».',
                'created_at' => now()->subMonths(4),
            ],
            [
                'action' => 'modification',
                'entity_type' => 'quote',
                'entity_id' => $quoteAccepted->id,
                'message' => 'Administrateur Système a validé le devis DEVIS-2026-001 (client Adam Zakin).',
                'created_at' => now()->subMonths(3)->addDays(5),
            ],
            [
                'action' => 'creation',
                'entity_type' => 'project',
                'entity_id' => $vrdProject->id,
                'message' => 'Administrateur Système a créé le projet « Aménagement de Voie Urbaine et VRD (Public — VRD) ».',
                'created_at' => now()->subMonths(2),
            ],
            [
                'action' => 'creation',
                'entity_type' => 'invoice',
                'entity_id' => null,
                'message' => 'Administrateur Système a enregistré la facture FACT-2026-001 — 1 020 000 MAD (payée).',
                'created_at' => now()->subMonths(2)->addDays(3),
            ],
            [
                'action' => 'modification',
                'entity_type' => 'project',
                'entity_id' => $vrdProject->id,
                'message' => 'Administrateur Système a mis à jour l\'avancement du lot Terrassement — projet VRD Médiouna.',
                'created_at' => now()->subWeeks(2),
            ],
        ];

        foreach ($entries as $entry) {
            AuditLog::query()->create([
                'company_id' => $companyId,
                'user_id' => $admin->id,
                'actor_label' => 'Administrateur Système',
                ...$entry,
            ]);
        }
    }
}
