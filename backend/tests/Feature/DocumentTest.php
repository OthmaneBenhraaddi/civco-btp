<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentTest extends TestCase
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

    public function test_admin_can_upload_list_download_and_archive_project_document(): void
    {
        Storage::fake('local');
        $this->actingAsAdmin();

        $clientResponse = $this->withHeaders($this->authHeaders())->postJson('/api/v1/clients', [
            'name' => 'Doc Client',
        ]);
        $clientId = $clientResponse->json('data.id');

        $projectResponse = $this->withHeaders($this->authHeaders())->postJson('/api/v1/projects', [
            'client_id' => $clientId,
            'title' => 'Doc Project',
        ]);
        $projectId = $projectResponse->json('data.id');

        $typesResponse = $this->withHeaders($this->authHeaders())->getJson('/api/v1/document-types?active_only=1');
        $typesResponse->assertOk();
        $planTypeId = collect($typesResponse->json('data'))
            ->firstWhere('name', 'Plan')['id']
            ?? $typesResponse->json('data.0.id');

        $uploadResponse = $this->withHeaders($this->authHeaders())->post("/api/v1/projects/{$projectId}/documents", [
            'file' => UploadedFile::fake()->create('plan.pdf', 100, 'application/pdf'),
            'document_type_id' => $planTypeId,
        ]);

        $uploadResponse->assertCreated()
            ->assertJsonPath('data.original_filename', 'plan.pdf')
            ->assertJsonPath('data.status', 'active');

        $documentId = $uploadResponse->json('data.id');

        $this->withHeaders($this->authHeaders())->getJson("/api/v1/projects/{$projectId}/documents")
            ->assertOk()
            ->assertJsonPath('data.0.id', $documentId);

        $this->withHeaders($this->authHeaders())->get("/api/v1/documents/{$documentId}/download")
            ->assertOk();

        $this->withHeaders($this->authHeaders())->putJson("/api/v1/documents/{$documentId}/archive")
            ->assertOk()
            ->assertJsonPath('data.status', 'archived');

        $this->assertDatabaseHas('documents', [
            'id' => $documentId,
            'status' => 'archived',
        ]);
    }

    public function test_document_from_other_company_is_not_accessible(): void
    {
        Storage::fake('local');
        $this->actingAsAdmin();

        $foreignCompany = \App\Models\Company::query()->create([
            'name' => 'Foreign Co',
            'visibility' => 'private',
            'is_active' => true,
        ]);

        $foreignClient = \App\Models\Client::query()->create([
            'company_id' => $foreignCompany->id,
            'name' => 'Foreign Client',
            'is_active' => true,
        ]);

        $foreignProject = Project::query()->create([
            'company_id' => $foreignCompany->id,
            'client_id' => $foreignClient->id,
            'reference' => 'PRJ-FOREIGN-001',
            'title' => 'Foreign',
            'status' => 'draft',
        ]);

        $document = $foreignProject->documents()->create([
            'company_id' => $foreignCompany->id,
            'uploaded_by_user_id' => User::query()->first()->id,
            'documentable_type' => Project::class,
            'documentable_id' => $foreignProject->id,
            'original_filename' => 'secret.pdf',
            'storage_path' => 'documents/999/secret.pdf',
            'mime_type' => 'application/pdf',
            'file_size' => 100,
            'status' => 'active',
        ]);

        $this->withHeaders($this->authHeaders())
            ->get("/api/v1/documents/{$document->id}/download")
            ->assertNotFound();
    }
}
