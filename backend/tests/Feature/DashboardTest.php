<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@btpdemo.fr')->firstOrFail();
        $this->actingAs($user);

        return $user;
    }

    private function authHeaders(): array
    {
        return [
            'Origin' => 'http://localhost:5173',
            'Accept' => 'application/json',
        ];
    }

    public function test_dashboard_summary_returns_company_kpis(): void
    {
        $this->actingAsAdmin();

        $company = Company::query()->where('siret', '12345678901234')->firstOrFail();
        $client = Client::query()->create([
            'company_id' => $company->id,
            'name' => 'Dashboard Client',
            'is_active' => true,
        ]);

        $project = Project::query()->create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'reference' => 'PRJ-DASH-001',
            'title' => 'Dashboard Project',
            'status' => 'in_progress',
            'progress_percent' => 60,
        ]);

        Expense::query()->create([
            'project_id' => $project->id,
            'recorded_by_user_id' => User::query()->first()->id,
            'label' => 'Test expense',
            'category' => 'materials',
            'amount' => 1000,
            'expense_date' => now()->toDateString(),
        ]);

        Invoice::query()->create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'project_id' => $project->id,
            'reference' => 'FAC-DASH-001',
            'status' => 'sent',
            'issued_at' => now()->toDateString(),
            'due_date' => now()->subDay()->toDateString(),
            'total_ht' => 5000,
            'total_tax' => 1000,
            'total_ttc' => 6000,
            'amount_paid' => 2000,
            'balance_due' => 4000,
        ]);

        $response = $this->withHeaders($this->authHeaders())->getJson('/api/v1/dashboard/summary');

        $response->assertOk()
            ->assertJsonPath('projects.total', 1)
            ->assertJsonPath('projects.by_status.in_progress', 1)
            ->assertJsonPath('projects.average_progress', 60)
            ->assertJsonPath('financial.total_revenue', 2000)
            ->assertJsonPath('financial.outstanding_balance', 4000)
            ->assertJsonPath('financial.overdue_invoices_count', 1)
            ->assertJsonPath('financial.total_expenses', 1000)
            ->assertJsonPath('recent_projects.0.reference', 'PRJ-DASH-001');
    }
}
