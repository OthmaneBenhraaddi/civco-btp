<?php

namespace Tests\Feature;

use App\Enums\ContractAmendmentStatus;
use App\Enums\ContractAmendmentType;
use App\Models\Client;
use App\Models\Contract;
use App\Models\ContractAmendment;
use App\Models\Project;
use App\Models\User;
use App\Services\ClientPortalProvisioningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractAmendmentTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(string $tenant = 'civco'): array
    {
        return [
            'Accept' => 'application/json',
            'X-Tenant' => $tenant,
        ];
    }

    private function actingAsUser(User $user): User
    {
        $this->flushSession();
        $this->actingAs($user);

        return $user;
    }

    private function actingAsCivcoAdmin(): User
    {
        $this->seed();

        $user = User::query()->where('email', 'admin@civco.ma')->firstOrFail();

        return $this->actingAsUser($user);
    }

    /**
     * @return array{project: Project, client: Client}
     */
    private function createProjectWithBudget(): array
    {
        $headers = $this->authHeaders();

        $clientId = $this->withHeaders($headers)->postJson('/api/v1/clients', [
            'name' => 'Client Avenant SA',
            'email' => 'avenant-client@test.ma',
            'contact_name' => 'Nadia Test',
        ])->assertCreated()->json('data.id');

        $projectId = $this->withHeaders($headers)->postJson('/api/v1/projects', [
            'client_id' => $clientId,
            'title' => 'Chantier avenant',
            'budget' => 1_000_000,
            'start_date' => '2026-01-01',
            'end_date' => '2026-06-30',
        ])->assertCreated()->json('data.id');

        return [
            'project' => Project::query()->findOrFail($projectId),
            'client' => Client::query()->findOrFail($clientId),
        ];
    }

    public function test_draft_amendment_does_not_change_revised_budget(): void
    {
        $this->actingAsCivcoAdmin();
        ['project' => $project] = $this->createProjectWithBudget();

        $this->withHeaders($this->authHeaders())->postJson("/api/v1/projects/{$project->id}/amendments", [
            'title' => 'Plus-value gros œuvre',
            'type' => ContractAmendmentType::Budget->value,
            'amount_change' => 150000,
            'duration_change_days' => 0,
        ])->assertCreated()->assertJsonPath('data.status', 'draft');

        $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.budget', 1000000)
            ->assertJsonPath('data.revised_budget', 1000000)
            ->assertJsonPath('data.end_date', '2026-06-30')
            ->assertJsonPath('data.revised_end_date', '2026-06-30');
    }

    public function test_validating_amendment_recalculates_revised_budget_and_end_date(): void
    {
        $this->actingAsCivcoAdmin();
        ['project' => $project] = $this->createProjectWithBudget();

        $amendmentId = $this->withHeaders($this->authHeaders())->postJson("/api/v1/projects/{$project->id}/amendments", [
            'title' => 'Extension délai + budget',
            'type' => ContractAmendmentType::Mixed->value,
            'amount_change' => 250000,
            'duration_change_days' => 15,
        ])->assertCreated()->json('data.id');

        $this->withHeaders($this->authHeaders())
            ->patchJson("/api/v1/amendments/{$amendmentId}/status", [
                'status' => ContractAmendmentStatus::Validated->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'validated')
            ->assertJsonPath('project.budget', 1000000)
            ->assertJsonPath('project.revised_budget', 1250000)
            ->assertJsonPath('project.end_date', '2026-06-30')
            ->assertJsonPath('project.revised_end_date', '2026-07-15');

        $project->refresh();
        $this->assertSame(1000000.0, (float) $project->budget);
        $this->assertSame('2026-06-30', $project->end_date->toDateString());
    }

    public function test_validated_amendment_cannot_be_deleted_and_original_contract_is_immutable(): void
    {
        $this->actingAsCivcoAdmin();
        ['project' => $project] = $this->createProjectWithBudget();

        $contract = Contract::query()->create([
            'tenant_id' => $project->tenant_id,
            'project_id' => $project->id,
            'client_id' => $project->client_id,
            'title' => 'Contrat initial',
            'content' => '<p>Contrat original</p>',
        ]);

        $amendmentId = $this->withHeaders($this->authHeaders())->postJson("/api/v1/projects/{$project->id}/amendments", [
            'title' => 'Avenant lié',
            'type' => ContractAmendmentType::Scope->value,
            'description' => 'Ajout d\'un lot second œuvre',
            'amount_change' => 80000,
        ])->assertCreated()->json('data.id');

        $this->assertSame($contract->id, ContractAmendment::query()->find($amendmentId)?->contract_id);

        $this->withHeaders($this->authHeaders())
            ->patchJson("/api/v1/amendments/{$amendmentId}/status", [
                'status' => ContractAmendmentStatus::Validated->value,
            ])
            ->assertOk();

        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/amendments/{$amendmentId}")
            ->assertUnprocessable();

        try {
            $contract->update(['content' => '<p>Tentative d\'écrasement</p>']);
            $this->fail('Le contenu du contrat initial doit rester immutable.');
        } catch (\Illuminate\Validation\ValidationException $exception) {
            $this->assertArrayHasKey('content', $exception->errors());
        }

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $contract->delete();
    }

    public function test_client_portal_lists_pending_amendments_and_can_accept(): void
    {
        $admin = $this->actingAsCivcoAdmin();
        ['project' => $project, 'client' => $client] = $this->createProjectWithBudget();

        $amendmentId = $this->withHeaders($this->authHeaders())->postJson("/api/v1/projects/{$project->id}/amendments", [
            'title' => 'Attente client',
            'type' => ContractAmendmentType::Duration->value,
            'duration_change_days' => 10,
        ])->assertCreated()->json('data.id');

        $this->withHeaders($this->authHeaders())
            ->patchJson("/api/v1/amendments/{$amendmentId}/status", [
                'status' => ContractAmendmentStatus::PendingClient->value,
            ])
            ->assertOk();

        $company = $admin->primaryCompany();
        $this->assertNotNull($company);

        $portalUser = app(ClientPortalProvisioningService::class)
            ->ensurePortalUser($client->fresh(), $company);

        $this->actingAsUser($portalUser);

        $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/client-portal/projects/{$project->id}/amendments")
            ->assertOk()
            ->assertJsonPath('data.0.status', 'pending_client')
            ->assertJsonPath('data.0.title', 'Attente client');

        $this->withHeaders($this->authHeaders())
            ->patchJson("/api/v1/client-portal/amendments/{$amendmentId}/status", [
                'status' => ContractAmendmentStatus::Validated->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'validated');

        $this->actingAsUser($admin);
        $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.revised_end_date', '2026-07-10');
    }

    public function test_refused_amendment_does_not_affect_revised_totals(): void
    {
        $this->actingAsCivcoAdmin();
        ['project' => $project] = $this->createProjectWithBudget();

        $amendmentId = $this->withHeaders($this->authHeaders())->postJson("/api/v1/projects/{$project->id}/amendments", [
            'title' => 'Refusé',
            'type' => ContractAmendmentType::Budget->value,
            'amount_change' => 500000,
        ])->assertCreated()->json('data.id');

        $this->withHeaders($this->authHeaders())
            ->patchJson("/api/v1/amendments/{$amendmentId}/status", [
                'status' => ContractAmendmentStatus::Refused->value,
            ])
            ->assertOk();

        $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.revised_budget', 1000000);
    }
}
