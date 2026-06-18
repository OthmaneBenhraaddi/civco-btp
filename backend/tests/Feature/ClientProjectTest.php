<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClientProjectTest extends TestCase
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

    public function test_admin_can_manage_clients_and_projects(): void
    {
        $this->actingAsAdmin();

        $clientResponse = $this->withHeaders($this->authHeaders())->postJson('/api/v1/clients', [
            'name' => 'Client Test SA',
            'email' => 'client@test.fr',
        ]);

        $clientResponse->assertCreated();
        $clientId = $clientResponse->json('data.id');

        $projectResponse = $this->withHeaders($this->authHeaders())->postJson('/api/v1/projects', [
            'client_id' => $clientId,
            'title' => 'Rénovation immeuble',
            'status' => 'planned',
        ]);

        $projectResponse->assertCreated()
            ->assertJsonPath('data.reference', fn ($value) => str_starts_with($value, 'PRJ-'));

        $projectId = $projectResponse->json('data.id');

        $phaseResponse = $this->withHeaders($this->authHeaders())->postJson("/api/v1/projects/{$projectId}/phases", [
            'name' => 'Gros oeuvre',
        ]);

        $phaseResponse->assertCreated();
        $phaseId = $phaseResponse->json('data.id');

        $taskResponse = $this->withHeaders($this->authHeaders())->postJson("/api/v1/phases/{$phaseId}/tasks", [
            'title' => 'Coulage dalle',
            'progress_percent' => 50,
            'status' => 'in_progress',
        ]);

        $taskResponse->assertCreated();

        $this->withHeaders($this->authHeaders())->postJson("/api/v1/projects/{$projectId}/progress", [
            'percent' => 50,
            'comment' => 'Midway update',
        ])->assertCreated();

        $this->withHeaders($this->authHeaders())->getJson("/api/v1/projects/{$projectId}")
            ->assertOk()
            ->assertJsonPath('data.progress_percent', fn ($value) => (float) $value === 50.0)
            ->assertJsonPath('data.phases.0.name', 'Gros oeuvre')
            ->assertJsonPath('data.phases.0.tasks.0.title', 'Coulage dalle');

        $this->assertDatabaseHas('clients', ['id' => $clientId, 'name' => 'Client Test SA']);
        $this->assertDatabaseHas('projects', ['id' => $projectId, 'title' => 'Rénovation immeuble']);
    }

    public function test_client_from_other_company_is_not_accessible(): void
    {
        $this->actingAsAdmin();

        $foreignCompany = Company::query()->create([
            'name' => 'Foreign Co',
            'visibility' => 'private',
            'is_active' => true,
        ]);

        $foreignClient = Client::query()->create([
            'company_id' => $foreignCompany->id,
            'name' => 'Foreign Client',
            'is_active' => true,
        ]);

        $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/clients/{$foreignClient->id}")
            ->assertNotFound();
    }
}
