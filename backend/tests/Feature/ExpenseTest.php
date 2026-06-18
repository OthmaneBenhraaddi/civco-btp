<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseTest extends TestCase
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

    private function createProject(): Project
    {
        $company = Company::query()->where('siret', '12345678901234')->firstOrFail();

        $client = Client::query()->create([
            'company_id' => $company->id,
            'name' => 'Expense Client',
            'is_active' => true,
        ]);

        return Project::query()->create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'reference' => 'PRJ-EXP-001',
            'title' => 'Expense Project',
            'status' => 'in_progress',
            'progress_percent' => 40,
        ]);
    }

    public function test_admin_can_manage_project_expenses(): void
    {
        $this->actingAsAdmin();
        $project = $this->createProject();

        $createResponse = $this->withHeaders($this->authHeaders())->postJson(
            "/api/v1/projects/{$project->id}/expenses",
            [
                'label' => 'Ciment',
                'category' => 'materials',
                'amount' => 450.50,
                'expense_date' => '2026-06-01',
                'notes' => 'Livraison chantier',
            ],
        );

        $createResponse->assertCreated()
            ->assertJsonPath('data.label', 'Ciment');

        $expenseId = $createResponse->json('data.id');

        $this->withHeaders($this->authHeaders())->getJson("/api/v1/projects/{$project->id}/expenses")
            ->assertOk()
            ->assertJsonPath('data.0.id', $expenseId);

        $this->withHeaders($this->authHeaders())->putJson("/api/v1/expenses/{$expenseId}", [
            'amount' => 500,
        ])->assertOk()
            ->assertJsonPath('data.amount', 500);

        $this->withHeaders($this->authHeaders())->deleteJson("/api/v1/expenses/{$expenseId}")
            ->assertOk();

        $this->assertDatabaseMissing('expenses', ['id' => $expenseId]);
    }
}
