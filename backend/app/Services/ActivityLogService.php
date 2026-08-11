<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\Document;
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

    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

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

        if ($task->wasChanged('status') && $task->status === TaskStatus::Done) {
            $this->notifyCompanyAdmins(
                $companyId,
                'Tâche terminée',
                $description,
            );
        }

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
        $this->notificationService->notifyCompanyAdmins(
            $companyId,
            $title,
            $message,
            $excludeUserId,
        );
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
        );
    }

    public function logClientCreated(Client $client): void
    {
        $actor = $this->actorLabel();

        $this->log(
            $client->company_id,
            null,
            'created',
            "{$actor} a créé le client « {$client->name} ».",
        );

        $this->notifyCompanyAdmins(
            $client->company_id,
            'Nouveau client',
            "{$actor} a créé le client « {$client->name} ».",
        );
    }

    public function logDocumentUploaded(Project $project, Document $document): void
    {
        $actor = $this->actorLabel();

        $this->log(
            $project->company_id,
            $project->id,
            'created',
            "{$actor} a ajouté le document « {$document->original_filename} » au projet « {$project->title} ».",
        );

        $this->notifyCompanyAdmins(
            $project->company_id,
            'Document ajouté',
            "{$actor} a ajouté « {$document->original_filename} » au projet « {$project->title} ».",
        );
    }

    public function logTeamMemberAccessToggled(User $member, UserStatus $nextStatus, ?User $actor = null): void
    {
        $companyId = $member->companies()
            ->orderByDesc('company_user.is_primary')
            ->value('companies.id');

        if ($companyId === null) {
            return;
        }

        $actorLabel = $actor !== null ? trim($actor->full_name) : $this->actorLabel();
        $memberLabel = trim($member->full_name) !== '' ? trim($member->full_name) : $member->email;
        $isDeactivating = $nextStatus !== UserStatus::Active;

        $description = $isDeactivating
            ? "🔐 Sécurité — Accès désactivé pour {$memberLabel} par {$actorLabel}."
            : "🔐 Sécurité — Accès réactivé pour {$memberLabel} par {$actorLabel}.";

        $this->log(
            $companyId,
            null,
            'updated',
            $description,
            $actor?->id,
        );
    }

    public function logTeamMemberRoleChanged(
        User $member,
        string $previousRoleName,
        string $newRoleName,
        ?User $actor = null,
    ): void {
        $companyId = $member->companies()
            ->orderByDesc('company_user.is_primary')
            ->value('companies.id');

        if ($companyId === null) {
            return;
        }

        $actorLabel = $actor !== null ? trim($actor->full_name) : $this->actorLabel();
        $memberLabel = trim($member->full_name) !== '' ? trim($member->full_name) : $member->email;
        $safePrevious = trim($previousRoleName) !== '' ? trim($previousRoleName) : '—';
        $safeNext = trim($newRoleName) !== '' ? trim($newRoleName) : 'Membre';

        $this->log(
            $companyId,
            null,
            'updated',
            "🔐 Sécurité — {$actorLabel} a changé le rôle de {$memberLabel} de « {$safePrevious} » en « {$safeNext} ».",
            $actor?->id,
        );
    }

    public function logTeamMemberArchived(User $member, ?User $actor = null): void
    {
        $companyId = $member->companies()
            ->orderByDesc('company_user.is_primary')
            ->value('companies.id');

        if ($companyId === null) {
            return;
        }

        $actorLabel = $actor !== null ? trim($actor->full_name) : $this->actorLabel();
        $memberLabel = trim($member->full_name) !== '' ? trim($member->full_name) : $member->email;

        $this->log(
            $companyId,
            null,
            'updated',
            "🔐 Sécurité — {$actorLabel} a archivé le compte de {$memberLabel}. Accès bloqué, historique conservé.",
            $actor?->id,
        );
    }

    public function logClientArchived(Client $client, ?User $actor = null): void
    {
        $actorLabel = $actor !== null ? trim($actor->full_name) : $this->actorLabel();

        $this->log(
            $client->company_id,
            null,
            'updated',
            "🔐 Sécurité — {$actorLabel} a archivé le client « {$client->name} ». Données et historique conservés.",
            $actor?->id,
        );
    }

    public function logCredentialsUpdated(
        User $member,
        string $roleLabel,
        string $newEmail,
        bool $emailChanged,
        bool $passwordChanged,
        ?User $actor = null,
    ): void {
        $companyId = $member->companies()
            ->orderByDesc('company_user.is_primary')
            ->value('companies.id');

        if ($companyId === null) {
            return;
        }

        $memberLabel = trim($member->full_name) !== '' ? trim($member->full_name) : $member->email;
        $actorLabel = $actor !== null ? trim($actor->full_name) : $memberLabel;
        $safeRoleLabel = trim($roleLabel) !== '' ? $roleLabel : 'Membre';

        if ($emailChanged && $passwordChanged) {
            $description = "🔐 Sécurité — {$actorLabel} ({$safeRoleLabel}) a mis à jour son e-mail et son mot de passe (Nouvel e-mail: {$newEmail}).";
        } elseif ($passwordChanged) {
            $description = "🔐 Sécurité — {$actorLabel} ({$safeRoleLabel}) a mis à jour son mot de passe.";
        } else {
            $description = "🔐 Sécurité — {$actorLabel} ({$safeRoleLabel}) a mis à jour son e-mail (Nouvel e-mail: {$newEmail}).";
        }

        $this->log(
            $companyId,
            null,
            'updated',
            $description,
            $actor?->id ?? $member->id,
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
