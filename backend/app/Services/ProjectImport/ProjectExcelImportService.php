<?php

namespace App\Services\ProjectImport;

use App\Dto\ProjectImport\ImportResult;
use App\Dto\ProjectImport\ImportRow;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Task;
use App\Services\ProjectProgressService;
use App\Support\ProjectImport\ProjectImportSchema;
use App\Support\TenantManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectExcelImportService
{
    public function __construct(
        private readonly ProjectExcelParser $parser,
        private readonly ProjectProgressService $progressService,
    ) {}

    public function parse(UploadedFile $file): ImportResult
    {
        return $this->parser->parseFile($file->getRealPath() ?: $file->getPathname());
    }

    /**
     * @return array{tasks_imported: int, phases_created: int, phases_reused: int}
     */
    public function import(Project $project, ImportResult $parsed): array
    {
        if (! $parsed->isValid()) {
            return ['tasks_imported' => 0, 'phases_created' => 0, 'phases_reused' => 0];
        }

        return DB::transaction(function () use ($project, $parsed): array {
            $project->load('phases.tasks');

            $phasesByName = [];
            foreach ($project->phases as $phase) {
                $phasesByName[ProjectImportSchema::normalize($phase->name)] = $phase;
            }

            $nextPhaseSort = (int) ($project->phases()->max('sort_order') ?? 0);
            $createdPhases = 0;
            $reusedPhaseKeys = [];
            $imported = 0;
            $touchedPhaseIds = [];

            foreach ($parsed->rows as $row) {
                $key = ProjectImportSchema::normalize($row->phase);
                $isNew = ! isset($phasesByName[$key]);

                if ($isNew) {
                    $nextPhaseSort++;
                    $phase = $project->phases()->create([
                        'name' => $row->phase,
                        'sort_order' => $nextPhaseSort,
                        'planned_start_date' => $row->plannedStartDate?->toDateString(),
                        'planned_end_date' => $row->plannedEndDate?->toDateString(),
                    ]);
                    $phasesByName[$key] = $phase;
                    $createdPhases++;
                } else {
                    $phase = $phasesByName[$key];
                    $reusedPhaseKeys[$key] = true;
                    $this->expandPhaseDates($phase, $row);
                }

                $sortOrder = (int) ($phase->tasks()->max('sort_order') ?? 0) + 1;

                $task = $phase->tasks()->create([
                    'tenant_id' => $project->tenant_id ?? TenantManager::currentId(),
                    'title' => $row->title,
                    'description' => $row->description,
                    'unit' => $row->unit,
                    'quantity' => $row->quantity,
                    'unit_price' => $row->unitPrice,
                    'status' => $row->status,
                    'progress_percent' => $row->status === TaskStatus::Done ? 100 : 0,
                    'planned_start_date' => $row->plannedStartDate?->toDateString(),
                    'due_date' => $row->plannedEndDate?->toDateString(),
                    'completed_at' => $row->status === TaskStatus::Done ? now() : null,
                    'sort_order' => $sortOrder,
                ]);

                $imported++;
                $touchedPhaseIds[$phase->id] = $phase->id;
            }

            foreach ($touchedPhaseIds as $phaseId) {
                $phase = ProjectPhase::query()->find($phaseId);
                if ($phase !== null) {
                    $this->progressService->rollupPhase($phase);
                }
            }

            $this->progressService->rollupProject($project->fresh());

            return [
                'tasks_imported' => $imported,
                'phases_created' => $createdPhases,
                'phases_reused' => count($reusedPhaseKeys),
            ];
        });
    }

    private function expandPhaseDates(ProjectPhase $phase, ImportRow $row): void
    {
        $updates = [];

        if ($row->plannedStartDate !== null) {
            $current = $phase->planned_start_date;
            if ($current === null || $row->plannedStartDate->lt($current)) {
                $updates['planned_start_date'] = $row->plannedStartDate->toDateString();
            }
        }

        if ($row->plannedEndDate !== null) {
            $current = $phase->planned_end_date;
            if ($current === null || $row->plannedEndDate->gt($current)) {
                $updates['planned_end_date'] = $row->plannedEndDate->toDateString();
            }
        }

        if ($updates !== []) {
            $phase->update($updates);
        }
    }

    public function filenameFor(Project $project): string
    {
        $slug = Str::slug($project->reference ?: $project->title ?: 'projet');

        return 'modele-import-chantier-'.$slug.'.xlsx';
    }
}
