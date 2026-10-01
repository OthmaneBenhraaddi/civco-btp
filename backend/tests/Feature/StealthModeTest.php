<?php

namespace Tests\Feature;

use App\Enums\DocumentStatus;
use App\Models\Client;
use App\Models\Company;
use App\Models\Document;
use App\Models\Project;
use App\Models\Quote;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StealthModeTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $this->seed();

        $tenant = Tenant::query()->where('subdomain', 'civco')->firstOrFail();
        $user = User::query()
            ->where('tenant_id', $tenant->id)
            ->where('role', 'admin')
            ->firstOrFail();
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

    private function stealthHeaders(): array
    {
        return [
            ...$this->authHeaders(),
            'X-Stealth-Mode' => 'enabled',
        ];
    }

    public function test_stealth_mode_hides_confidential_records_and_keeps_mixed_clients(): void
    {
        Storage::fake('local');
        config(['sanctum.stateful' => ['localhost', 'localhost:5173', '127.0.0.1', '127.0.0.1:8000']]);
        $user = $this->actingAsAdmin();
        $company = Company::query()->where('name', 'CivCo')->firstOrFail();

        $before = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->json('projects.total');

        $publicClient = $this->makeClient($company, $user, 'ZzStealth Public', true);
        $hiddenClient = $this->makeClient($company, $user, 'ZzStealth Hidden', false);
        $mixedClient = $this->makeClient($company, $user, 'ZzStealth Mixed', false);

        $publicProject = $this->makeProject($company, $user, $publicClient, 'ZzStealth Public Work', true);
        $hiddenProject = $this->makeProject($company, $user, $hiddenClient, 'ZzStealth Hidden Work', false);
        $mixedPublicProject = $this->makeProject($company, $user, $mixedClient, 'ZzStealth Mixed Public', true);
        $mixedHiddenProject = $this->makeProject($company, $user, $mixedClient, 'ZzStealth Mixed Hidden', false);

        $visibleDocument = $this->makeDocument($company, $user, $mixedPublicProject, 'visible.pdf');
        $hiddenDocument = $this->makeDocument($company, $user, $hiddenProject, 'hidden.pdf');
        $quote = Quote::query()->create([
            'company_id' => $company->id,
            'client_id' => $hiddenClient->id,
            'reference' => 'DEV-STEALTH-HIDDEN',
            'status' => 'draft',
            'tenant_id' => $user->tenant_id,
        ]);
        $quoteDocument = $this->makeDocument($company, $user, $quote, 'hidden-quote.pdf');

        $openClients = collect($this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/clients?search=ZzStealth&per_page=50')
            ->assertOk()
            ->json('data'))->pluck('name');

        $this->assertEqualsCanonicalizing(
            ['ZzStealth Public', 'ZzStealth Hidden', 'ZzStealth Mixed'],
            $openClients->all(),
        );

        $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/projects?client_id='.$mixedClient->id.'&per_page=50')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/clients/'.$mixedClient->id)
            ->assertOk()
            ->assertJsonPath('data.projects_count', 2);

        $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/documents/'.$hiddenDocument->id.'/download')
            ->assertOk();

        $this->withHeaders($this->authHeaders())
            ->putJson('/api/v1/projects/'.$publicProject->id, [
                'title' => 'ZzStealth Public Work Updated',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'ZzStealth Public Work Updated');

        $stealthClients = collect($this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/clients?search=ZzStealth&per_page=50')
            ->assertOk()
            ->json('data'))->pluck('name');

        $this->assertEqualsCanonicalizing(
            ['ZzStealth Public', 'ZzStealth Mixed'],
            $stealthClients->all(),
        );

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/clients/'.$hiddenClient->id)
            ->assertNotFound();

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/clients/'.$mixedClient->id)
            ->assertOk()
            ->assertJsonPath('data.projects_count', 1)
            ->assertJsonPath('data.public_projects_count', 1);

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/projects?client_id='.$mixedClient->id.'&per_page=50')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mixedPublicProject->id)
            ->assertJsonPath('data.0.is_official', true);

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/projects/'.$mixedHiddenProject->id)
            ->assertNotFound();

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/projects/'.$hiddenProject->id)
            ->assertNotFound();

        $projectTitles = collect($this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/search?q=ZzStealth')
            ->assertOk()
            ->json('results.projects'))->pluck('label');

        $this->assertTrue($projectTitles->contains('ZzStealth Public Work Updated'));
        $this->assertTrue($projectTitles->contains('ZzStealth Mixed Public'));
        $this->assertFalse($projectTitles->contains('ZzStealth Hidden Work'));
        $this->assertFalse($projectTitles->contains('ZzStealth Mixed Hidden'));

        $clientLabels = collect($this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/search?q=ZzStealth')
            ->assertOk()
            ->json('results.clients'))->pluck('label');

        $this->assertTrue($clientLabels->contains('ZzStealth Mixed'));
        $this->assertFalse($clientLabels->contains('ZzStealth Hidden'));

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/dashboard/summary')
            ->assertOk()
            ->assertJsonPath('projects.total', $before + 2);

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/projects/'.$mixedPublicProject->id.'/documents')
            ->assertOk()
            ->assertJsonPath('data.0.id', $visibleDocument->id);

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/documents/'.$hiddenDocument->id.'/download')
            ->assertNotFound();

        $this->withHeaders($this->stealthHeaders())
            ->getJson('/api/v1/documents/'.$quoteDocument->id.'/download')
            ->assertNotFound();

        $this->withHeaders($this->authHeaders())
            ->putJson('/api/v1/me/stealth-mode', ['enabled' => true])
            ->assertOk()
            ->assertJsonPath('stealth_mode_enabled', true);

        $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('stealth_mode_enabled', true);

        $sessionClients = collect($this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/clients?search=ZzStealth&per_page=50')
            ->assertOk()
            ->json('data'))->pluck('name');

        $this->assertFalse($sessionClients->contains('ZzStealth Hidden'));
        $this->assertTrue($sessionClients->contains('ZzStealth Mixed'));

        $this->withHeaders([
            ...$this->authHeaders(),
            'X-Stealth-Mode' => 'disabled',
        ])->getJson('/api/v1/clients/'.$hiddenClient->id)
            ->assertOk();
    }

    private function makeClient(Company $company, User $user, string $name, bool $official): Client
    {
        return Client::query()->create([
            'company_id' => $company->id,
            'tenant_id' => $user->tenant_id,
            'name' => $name,
            'is_active' => true,
            'is_official' => $official,
        ]);
    }

    private function makeProject(Company $company, User $user, Client $client, string $title, bool $official): Project
    {
        return Project::query()->create([
            'company_id' => $company->id,
            'tenant_id' => $user->tenant_id,
            'client_id' => $client->id,
            'reference' => 'PRJ-'.str_replace(' ', '-', $title),
            'title' => $title,
            'status' => 'planned',
            'is_official' => $official,
        ]);
    }

    private function makeDocument(Company $company, User $user, Project|Quote $parent, string $filename): Document
    {
        $path = 'documents/'.$filename;
        Storage::disk('local')->put($path, 'stealth-test');

        return Document::query()->create([
            'company_id' => $company->id,
            'uploaded_by_user_id' => $user->id,
            'documentable_type' => $parent->getMorphClass(),
            'documentable_id' => $parent->id,
            'original_filename' => $filename,
            'storage_path' => $path,
            'mime_type' => 'application/pdf',
            'file_size' => 12,
            'status' => DocumentStatus::Active,
        ]);
    }
}
