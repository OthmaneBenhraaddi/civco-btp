<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\ProjectImport\ProjectExcelTemplateService;
use App\Support\ProjectImport\ProjectImportSchema;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

class ProjectExcelImportTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(string $tenant = 'civco'): array
    {
        return [
            'Accept' => 'application/json',
            'X-Tenant' => $tenant,
        ];
    }

    private function actingAsCivcoAdmin(): User
    {
        $this->seed();
        $user = User::query()->where('email', 'admin@civco.ma')->firstOrFail();
        $this->flushSession();
        $this->actingAs($user);

        return $user;
    }

    private function createProject(): Project
    {
        $clientId = $this->withHeaders($this->authHeaders())->postJson('/api/v1/clients', [
            'name' => 'Client Import Excel',
            'email' => 'import-excel@test.ma',
            'contact_name' => 'Karim Import',
        ])->assertCreated()->json('data.id');

        $projectId = $this->withHeaders($this->authHeaders())->postJson('/api/v1/projects', [
            'client_id' => $clientId,
            'title' => 'Chantier import Excel',
            'budget' => 500000,
            'start_date' => '2026-09-01',
            'end_date' => '2026-12-31',
        ])->assertCreated()->json('data.id');

        return Project::query()->findOrFail($projectId);
    }

    /**
     * @param  list<list<mixed>>  $rows
     */
    private function xlsxUpload(array $rows, string $name = 'chantier.xlsx'): UploadedFile
    {
        $spreadsheet = app(ProjectExcelTemplateService::class)->buildSpreadsheet();
        $sheet = $spreadsheet->getSheetByName(ProjectImportSchema::DATA_SHEET);

        foreach ($rows as $rowIndex => $values) {
            foreach ($values as $colIndex => $value) {
                if ($value === null) {
                    continue;
                }
                $letter = ProjectImportSchema::columnLetter($colIndex);
                $sheet->setCellValue($letter.($rowIndex + 2), $value);
            }
        }

        return $this->spreadsheetToUpload($spreadsheet, $name);
    }

    private function spreadsheetToUpload(Spreadsheet $spreadsheet, string $name): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'xlsx').'.xlsx';
        (new Xlsx($spreadsheet))->save($path);
        $spreadsheet->disconnectWorksheets();

        return new UploadedFile(
            $path,
            $name,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            null,
            true,
        );
    }

    public function test_admin_can_download_excel_template(): void
    {
        $this->actingAsCivcoAdmin();
        $project = $this->createProject();

        $response = $this->withHeaders($this->authHeaders())
            ->get("/api/v1/projects/{$project->id}/import/template");

        $response->assertOk();
        $this->assertStringContainsString(
            'spreadsheetml.sheet',
            (string) $response->headers->get('content-type'),
        );
        $this->assertGreaterThan(1000, strlen($response->getContent()));
    }

    public function test_valid_excel_import_creates_phases_and_tasks_transactionally(): void
    {
        $this->actingAsCivcoAdmin();
        $project = $this->createProject();

        $file = $this->xlsxUpload([
            ['Gros œuvre', 'Fondations isolées', 'Béton', 'm³', 45, 850, '01/09/2026', '20/09/2026', 'À faire'],
            ['Gros œuvre', 'Élévation murs', null, 'm²', 220, 420, '21/09/2026', '15/10/2026', 'En cours'],
            ['Second œuvre', 'Menuiseries', null, 'u', 18, 3200, '16/10/2026', '30/10/2026', 'À faire'],
        ]);

        $this->withHeaders($this->authHeaders())
            ->post("/api/v1/projects/{$project->id}/import", ['file' => $file])
            ->assertOk()
            ->assertJsonPath('data.tasks_imported', 3)
            ->assertJsonPath('data.phases_created', 2);

        $project->refresh()->load('phases.tasks');
        $this->assertCount(2, $project->phases);
        $this->assertSame(3, $project->phases->sum(fn ($phase) => $phase->tasks->count()));

        $foundations = Task::query()
            ->where('title', 'Fondations isolées')
            ->whereHas('phase', fn ($query) => $query->where('project_id', $project->id))
            ->firstOrFail();
        $this->assertSame(45.0, (float) $foundations->quantity);
        $this->assertSame('m³', $foundations->unit);
        $this->assertSame(850.0, (float) $foundations->unit_price);
        $this->assertSame('2026-09-01', $foundations->planned_start_date?->toDateString());
        $this->assertSame('2026-09-20', $foundations->due_date?->toDateString());
    }

    public function test_invalid_excel_returns_detailed_errors_and_imports_nothing(): void
    {
        $this->actingAsCivcoAdmin();
        $project = $this->createProject();

        $this->withHeaders($this->authHeaders())->postJson("/api/v1/projects/{$project->id}/phases", [
            'name' => 'Préparation',
        ])->assertCreated();

        $existingTasks = Task::query()->count();

        $file = $this->xlsxUpload([
            ['Gros œuvre', 'Fondations', null, 'm³', 'abc', 850, '01/09/2026', '20/09/2026', 'À faire'],
            [null, 'Sans phase', null, 'u', 1, 10, null, null, 'todo'],
        ]);

        $this->withHeaders($this->authHeaders())
            ->post("/api/v1/projects/{$project->id}/import", ['file' => $file])
            ->assertUnprocessable()
            ->assertJsonPath('errors.0.row', 2)
            ->assertJsonPath('errors.0.column', 'E');

        $this->assertSame($existingTasks, Task::query()->count());
        $this->assertSame(1, $project->phases()->count());
        $this->assertFalse($project->phases()->where('name', 'Gros œuvre')->exists());
    }
}
