<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\DocumentType;
use App\Models\Project;
use App\Models\Role;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectDocumentLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_documents_link_to_projects_inside_the_entity_and_follow_stealth(): void
    {
        Storage::fake('local');
        config(['sanctum.stateful' => ['localhost', 'localhost:5173', '127.0.0.1', '127.0.0.1:8000']]);

        $this->seed(PermissionSeeder::class);
        $this->seed(RoleSeeder::class);

        $tenant = Tenant::query()->create([
            'name' => 'CivCo',
            'subdomain' => 'civco',
            'status' => 'active',
        ]);
        $company = Company::query()->create([
            'name' => 'CivCo',
            'visibility' => 'private',
            'is_active' => true,
        ]);
        $admin = $this->makeStaff($tenant, $company, 'docs-admin@civco.test', 'admin', 'admin');
        $client = Client::query()->create([
            'tenant_id' => $tenant->id,
            'company_id' => $company->id,
            'name' => 'Doc Client',
            'is_active' => true,
            'is_official' => true,
        ]);
        $publicProject = $this->makeProject($tenant, $company, $client, 'Public site', true);
        $hiddenProject = $this->makeProject($tenant, $company, $client, 'Hidden site', false);
        $type = DocumentType::query()->create([
            'company_id' => $company->id,
            'name' => 'Plan',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $otherTenant = Tenant::query()->create([
            'name' => 'Other',
            'subdomain' => 'otherco',
            'status' => 'active',
        ]);
        $otherCompany = Company::query()->create([
            'name' => 'Other Co',
            'visibility' => 'private',
            'is_active' => true,
        ]);
        $otherAdmin = $this->makeStaff($otherTenant, $otherCompany, 'docs-other@civco.test', 'admin', 'admin');

        $headers = ['Accept' => 'application/json'];
        $this->flushSession();
        $this->actingAs($admin);

        $linked = $this->withHeaders($headers)->post('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('plan.pdf', 120, 'application/pdf'),
            'document_type_id' => $type->id,
            'project_id' => $publicProject->id,
        ]);

        $linked->assertCreated()
            ->assertJsonPath('data.project.id', $publicProject->id)
            ->assertJsonPath('data.original_filename', 'plan.pdf');

        $documentId = $linked->json('data.id');

        $this->withHeaders($headers)
            ->getJson('/api/v1/projects/'.$publicProject->id.'/documents')
            ->assertOk()
            ->assertJsonPath('data.0.id', $documentId);

        $this->withHeaders($headers)->post('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('loose.pdf', 80, 'application/pdf'),
            'document_type_id' => $type->id,
        ])->assertCreated()
            ->assertJsonPath('data.project', null);

        $hiddenUpload = $this->withHeaders($headers)->post('/api/v1/documents', [
            'file' => UploadedFile::fake()->create('secret.pdf', 80, 'application/pdf'),
            'document_type_id' => $type->id,
            'project_id' => $hiddenProject->id,
        ])->assertCreated();

        $this->withHeaders([
            ...$headers,
            'X-Stealth-Mode' => 'enabled',
        ])->getJson('/api/v1/documents?status=all')
            ->assertOk()
            ->assertJsonMissing(['original_filename' => 'secret.pdf']);

        $this->withHeaders($headers)
            ->deleteJson('/api/v1/documents/'.$documentId.'/project')
            ->assertOk()
            ->assertJsonPath('data.project', null);

        $this->withHeaders($headers)
            ->getJson('/api/v1/projects/'.$publicProject->id.'/documents')
            ->assertOk()
            ->assertJsonMissing(['id' => $documentId]);

        $this->flushSession();
        $this->actingAs($otherAdmin);
        $this->withHeaders($headers)
            ->get('/api/v1/documents/'.$hiddenUpload->json('data.id').'/download')
            ->assertNotFound();
    }

    private function makeProject(Tenant $tenant, Company $company, Client $client, string $title, bool $official): Project
    {
        return Project::query()->create([
            'tenant_id' => $tenant->id,
            'company_id' => $company->id,
            'client_id' => $client->id,
            'is_official' => $official,
            'reference' => 'PRJ-'.strtoupper(substr(md5($title), 0, 6)),
            'title' => $title,
            'status' => 'planned',
        ]);
    }

    private function makeStaff(Tenant $tenant, Company $company, string $email, string $userRole, string $roleSlug): User
    {
        $user = User::query()->create([
            'tenant_id' => $tenant->id,
            'first_name' => 'Test',
            'last_name' => 'Docs',
            'email' => $email,
            'password' => Hash::make('password'),
            'role' => $userRole,
            'is_active' => true,
            'status' => 'active',
        ]);

        $user->companies()->attach($company->id, [
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $role = Role::query()->whereNull('company_id')->where('slug', $roleSlug)->firstOrFail();
        $user->roles()->attach($role->id, ['company_id' => $company->id]);

        return $user;
    }
}
