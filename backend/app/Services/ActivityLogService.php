<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    /** @var list<string> */
    private const SILENT_PROJECT_FIELDS = [
        'progress_percent',
        'updated_at',
    ];

    public function log(
        int $companyId,
        ?int $projectId,
        string $actionType,
        string $description,
        ?int $userId = null,
    ): ActivityLog {
        return ActivityLog::query()->create([
            'company_id' => $companyId,
            'user_id' => $userId ?? Auth::id(),
            'project_id' => $projectId,
            'action_type' => $actionType,
            'description' => $description,
            'created_at' => now(),
        ]);
    }

    public function logProjectCreated(Project $project): void
    {
        $actor = $this->actorLabel();

        $this->log(
            $project->company_id,
            $project->id,
            'created',
            "{$actor} a créé le projet « {$project->title} » ({$project->reference}).",
        );

        $this->notifyCompanyAdmins(
            $project->company_id,
            'Nouveau projet',
            "{$actor} a créé le projet « {$project->title} ».",
            Auth::id(),
        );
    }

    public function logProjectUpdated(Project $project): void
    {
        $changes = collect($project->getChanges())
            ->keys()
            ->diff(self::SILENT_PROJECT_FIELDS);

        if ($changes->isEmpty()) {
            return;
        }

        $actor = $this->actorLabel();
        $description = "{$actor} a modifié le projet « {$project->title} ».";

        if ($project->wasChanged('status')) {
            $previous = $project->getOriginal('status');
            $previousLabel = $previous instanceof ProjectStatus ? $previous->value : (string) $previous;
            $currentLabel = $project->status instanceof ProjectStatus ? $project->status->value : (string) $project->status;
            $description = "{$actor} a changé le statut du projet « {$project->title} » : {$previousLabel} → {$currentLabel}.";

            $this->notifyCompanyAdmins(
                $project->company_id,
                'Statut projet modifié',
                $description,
                Auth::id(),
            );
        }

        $this->log($project->company_id, $project->id, 'updated', $description);
    }

    public function logProjectDeleted(Project $project): void
    {
        $actor = $this->actorLabel();

        $this->log(
            $project->company_id,
            $project->id,
            'deleted',
            "{$actor} a supprimé le projet « {$project->title} » ({$project->reference}).",
        );

        $this->notifyCompanyAdmins(
            $project->company_id,
            'Projet supprimé',
            "{$actor} a supprimé le projet « {$project->title} ».",
            Auth::id(),
        );
    }

    public function logTaskCreated(Task $task): void
    {
        $context = $this->taskContext($task);
        if ($context === null) {
            return;
        }

        ['company_id' => $companyId, 'project_id' => $projectId, 'project_title' => $projectTitle] = $context;
        $actor = $this->actorLabel();

        $this->log(
            $companyId,
            $projectId,
            'created',
            "{$actor} a ajouté la tâche « {$task->title} » sur le projet « {$projectTitle} ».",
        );
    }

    public function logTaskUpdated(Task $task): void
    {
        $context = $this->taskContext($task);
        if ($context === null) {
            return;
        }

        ['company_id' => $companyId, 'project_id' => $projectId, 'project_title' => $projectTitle, 'phase' => $phase] = $context;
        $actor = $this->actorLabel();

        if ($task->wasChanged('status') && $task->status === TaskStatus::Done) {
            $description = "{$actor} a terminé la tâche « {$task->title} » sur le projet « {$projectTitle} ».";
        } elseif ($task->wasChanged('progress_percent')) {
            $description = "{$actor} a mis à jour l'avancement de la tâche « {$task->title} » ({$task->progress_percent}%).";
        } else {
            $description = "{$actor} a modifié la tâche « {$task->title} » sur le projet « {$projectTitle} ».";
        }

        $this->log($companyId, $projectId, 'updated', $description);

        if ($task->wasChanged('status') && $task->status === TaskStatus::Done && $phase !== null) {
            $this->maybeNotifyPhaseCompleted($phase, $projectTitle);
        }
    }

    public function logTaskDeleted(Task $task, ?ProjectPhase $phase = null): void
    {
        $phase ??= $task->relationLoaded('phase') ? $task->phase : $task->phase()->with('project')->first();
        $project = $phase?->project;

        if ($project === null) {
            return;
        }

        $actor = $this->actorLabel();

        $this->log(
            $project->company_id,
            $project->id,
            'deleted',
            "{$actor} a supprimé la tâche « {$task->title} » sur le projet « {$project->title} ».",
        );
    }

    public function notifyCompanyAdmins(
        int $companyId,
        string $title,
        string $message,
        ?int $excludeUserId = null,
    ): void {
        $adminIds = User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->whereHas('companies', fn ($query) => $query->where('companies.id', $companyId))
            ->pluck('id');

        foreach ($adminIds as $adminId) {
            if ($excludeUserId !== null && (int) $adminId === $excludeUserId) {
                continue;
            }

            Notification::query()->create([
                'user_id' => $adminId,
                'title' => $title,
                'message' => $message,
                'read_at' => null,
                'created_at' => now(),
            ]);
        }
    }

    private function maybeNotifyPhaseCompleted(ProjectPhase $phase, string $projectTitle): void
    {
        $phase->loadMissing('tasks', 'project');

        if ($phase->tasks->isEmpty()) {
            return;
        }

        $allDone = $phase->tasks->every(
            fn (Task $item) => $item->status === TaskStatus::Done,
        );

        if (! $allDone) {
            return;
        }

        $actor = $this->actorLabel();

        $this->notifyCompanyAdmins(
            $phase->project->company_id,
            'Phase terminée',
            "{$actor} a complété la phase « {$phase->name} » du projet « {$projectTitle} ».",
            Auth::id(),
        );
    }

    /**
     * @return array{company_id: int, project_id: int, project_title: string, phase: ?ProjectPhase}|null
     */
    private function taskContext(Task $task): ?array
    {
        $phase = $task->relationLoaded('phase')
            ? $task->phase
            : $task->phase()->with('project')->first();

        $project = $phase?->project;

        if ($project === null) {
            return null;
        }

        return [
            'company_id' => $project->company_id,
            'project_id' => $project->id,
            'project_title' => $project->title,
            'phase' => $phase,
        ];
    }

    private function actorLabel(): string
    {
        $user = Auth::user();

        if ($user === null) {
            return 'Système';
        }

        $name = trim($user->full_name);

        return $name !== '' ? $name : 'Utilisateur';
    }
}
