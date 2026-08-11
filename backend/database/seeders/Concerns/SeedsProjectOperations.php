<?php

namespace Database\Seeders\Concerns;

use App\Enums\DeliveryFormStatus;
use App\Enums\DispatchNoteStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Models\DeliveryForm;
use App\Models\DeliveryFormLine;
use App\Models\DispatchNote;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Quote;
use App\Models\User;

trait SeedsProjectOperations
{
    /** @var array<string, int> */
    private array $deliveryFormCounters = [];

    /** @var array<string, int> */
    private array $dispatchNoteCounters = [];

    protected function seedProjectPhases(Project $project, User $assignee, ProjectStatus $status): void
    {
        $doneWeight = match ($status) {
            ProjectStatus::Completed => 1.0,
            ProjectStatus::InProgress => 0.55,
            ProjectStatus::Cancelled => 0.15,
            default => 0.25,
        };

        $phaseTemplates = [
            [
                'name' => 'Préparation & installation de chantier',
                'tasks' => [
                    'Installation base vie et clôture',
                    'Implantation et piquetage',
                ],
            ],
            [
                'name' => 'Exécution principale',
                'tasks' => [
                    'Travaux corps d\'état',
                    'Contrôle qualité intermédiaire',
                ],
            ],
            [
                'name' => 'Finitions & réception',
                'tasks' => [
                    'Second œuvre et finitions',
                    'Préparation réception provisoire',
                ],
            ],
        ];

        foreach ($phaseTemplates as $index => $template) {
            $phaseProgress = min(100, round(($index + 1) / count($phaseTemplates) * 100 * $doneWeight, 1));

            $phase = $project->phases()->create([
                'name' => $template['name'],
                'sort_order' => $index,
                'planned_start_date' => now()->subMonths(6 - $index)->toDateString(),
                'planned_end_date' => now()->subMonths(4 - $index)->toDateString(),
                'progress_percent' => $phaseProgress,
            ]);

            foreach ($template['tasks'] as $taskIndex => $taskTitle) {
                $taskProgress = min(100, (int) round($phaseProgress * (0.85 + ($taskIndex * 0.1))));

                $taskStatus = match (true) {
                    $status === ProjectStatus::Completed => TaskStatus::Done,
                    $taskProgress >= 80 => TaskStatus::Done,
                    $taskProgress >= 35 => TaskStatus::InProgress,
                    $status === ProjectStatus::Cancelled => TaskStatus::Blocked,
                    default => TaskStatus::Todo,
                };

                $phase->tasks()->create([
                    'tenant_id' => $project->tenant_id,
                    'assigned_to_user_id' => $assignee->id,
                    'title' => $taskTitle,
                    'status' => $taskStatus,
                    'progress_percent' => $taskProgress,
                    'due_date' => now()->subMonths(2 - $index)->toDateString(),
                    'completed_at' => $taskStatus === TaskStatus::Done ? now()->subWeeks(2) : null,
                    'sort_order' => $taskIndex,
                ]);
            }
        }
    }

    protected function seedLogisticsChain(
        int $tenantId,
        int $companyId,
        int $clientId,
        Project $project,
        Quote $quote,
        string $refPrefix,
        ProjectStatus $status,
    ): void {
        if (! in_array($status, [ProjectStatus::InProgress, ProjectStatus::Completed], true)) {
            return;
        }

        $this->deliveryFormCounters[$refPrefix] = ($this->deliveryFormCounters[$refPrefix] ?? 0) + 1;
        $blSequence = $this->deliveryFormCounters[$refPrefix];
        $blRef = sprintf('%s-BL-%03d', $refPrefix, $blSequence);

        $blStatus = $status === ProjectStatus::Completed
            ? DeliveryFormStatus::SignedAndStamped
            : DeliveryFormStatus::Signed;

        $deliveryForm = DeliveryForm::query()->create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'client_id' => $clientId,
            'project_id' => $project->id,
            'quote_id' => $quote->id,
            'reference' => $blRef,
            'status' => $blStatus,
            'delivery_date' => now()->subMonths($status === ProjectStatus::Completed ? 1 : 0)->toDateString(),
            'description' => 'Bon de livraison — '.$project->title,
        ]);

        $quote->load('lines');

        foreach ($quote->lines as $index => $line) {
            DeliveryFormLine::query()->create([
                'delivery_form_id' => $deliveryForm->id,
                'quote_line_id' => $line->id,
                'sort_order' => $index,
                'description' => $line->description,
                'quantity' => $line->quantity,
            ]);
        }

        if ($status !== ProjectStatus::Completed) {
            return;
        }

        $this->dispatchNoteCounters[$refPrefix] = ($this->dispatchNoteCounters[$refPrefix] ?? 0) + 1;
        $brSequence = $this->dispatchNoteCounters[$refPrefix];
        $brRef = sprintf('%s-BR-%03d', $refPrefix, $brSequence);

        $dispatchNote = DispatchNote::query()->create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'client_id' => $clientId,
            'reference_number' => $brRef,
            'status' => DispatchNoteStatus::Executed,
            'executed_at' => now()->subWeeks(3),
        ]);

        $deliveryForm->update(['dispatch_note_id' => $dispatchNote->id]);

        Invoice::query()
            ->where('project_id', $project->id)
            ->where('quote_id', $quote->id)
            ->update(['dispatch_note_id' => $dispatchNote->id]);
    }
}
