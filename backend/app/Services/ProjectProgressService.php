<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Task;

class ProjectProgressService
{
    public function rollupPhase(ProjectPhase $phase): void
    {
        $average = Task::query()
            ->where('project_phase_id', $phase->id)
            ->avg('progress_percent');

        $phase->update([
            'progress_percent' => round((float) ($average ?? 0), 2),
        ]);
    }

    public function rollupProject(Project $project): void
    {
        $project->load('phases');

        $average = $project->phases->avg('progress_percent');

        $project->update([
            'progress_percent' => round((float) ($average ?? 0), 2),
        ]);
    }

    public function rollupFromTask(Task $task): void
    {
        $phase = $task->phase()->with('project.phases')->first();

        if ($phase === null) {
            return;
        }

        $this->rollupPhase($phase);
        $this->rollupProject($phase->project);
    }
}
