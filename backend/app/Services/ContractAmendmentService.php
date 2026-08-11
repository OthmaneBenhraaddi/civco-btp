<?php

namespace App\Services;

use App\Enums\ContractAmendmentStatus;
use App\Models\ContractAmendment;
use App\Models\Project;
use App\Models\User;
use App\Support\TenantManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ContractAmendmentService
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(
        Project $project,
        array $attributes,
        User $actor,
        ?UploadedFile $file = null,
    ): ContractAmendment {
        $path = null;
        $originalName = null;

        if ($file !== null) {
            [$path, $originalName] = $this->storeFile($file, (int) $project->company_id);
        }

        $contractId = $attributes['contract_id'] ?? $project->contracts()->latest('id')->value('id');

        return $project->amendments()->create([
            'tenant_id' => $project->tenant_id ?? TenantManager::currentId(),
            'contract_id' => $contractId,
            'title' => $attributes['title'],
            'type' => $attributes['type'],
            'status' => ContractAmendmentStatus::Draft,
            'amount_change' => $attributes['amount_change'] ?? 0,
            'duration_change_days' => $attributes['duration_change_days'] ?? 0,
            'description' => $attributes['description'] ?? null,
            'file_path' => $path,
            'original_filename' => $originalName,
            'created_by_user_id' => $actor->id,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function update(
        ContractAmendment $amendment,
        array $attributes,
        ?UploadedFile $file = null,
    ): ContractAmendment {
        $this->assertMutable($amendment);

        if ($file !== null) {
            $amendment->deleteStoredFile();
            [$path, $originalName] = $this->storeFile($file, (int) $amendment->project->company_id);
            $attributes['file_path'] = $path;
            $attributes['original_filename'] = $originalName;
        }

        unset($attributes['status'], $attributes['contract_id']);

        $amendment->update($attributes);

        return $amendment->fresh(['createdBy', 'contract', 'project']);
    }

    public function delete(ContractAmendment $amendment): void
    {
        $this->assertMutable($amendment);

        $amendment->deleteStoredFile();
        $amendment->delete();
    }

    public function transition(
        ContractAmendment $amendment,
        ContractAmendmentStatus $target,
        bool $asClient = false,
    ): ContractAmendment {
        $current = $amendment->status ?? ContractAmendmentStatus::Draft;
        $allowed = $this->allowedTransitions($current, $asClient);

        if (! in_array($target, $allowed, true)) {
            throw ValidationException::withMessages([
                'status' => [sprintf(
                    'Transition de « %s » vers « %s » interdite.',
                    $current->value,
                    $target->value,
                )],
            ]);
        }

        $updates = ['status' => $target];

        if ($target === ContractAmendmentStatus::PendingClient) {
            $updates['submitted_at'] = now();
        }

        if ($target === ContractAmendmentStatus::Validated) {
            $updates['validated_at'] = now();
        }

        if ($target === ContractAmendmentStatus::Refused) {
            $updates['refused_at'] = now();
        }

        $amendment->update($updates);

        $fresh = $amendment->fresh(['createdBy', 'contract', 'project']);

        if ($target === ContractAmendmentStatus::PendingClient) {
            $this->notificationService->notifyAmendmentPending($fresh);
        }

        if (in_array($target, [
            ContractAmendmentStatus::Validated,
            ContractAmendmentStatus::Refused,
        ], true)) {
            $this->notificationService->notifyAmendmentResolved($fresh);
        }

        return $fresh;
    }

    /**
     * @return Collection<int, ContractAmendment>
     */
    public function visibleToClient(Project $project): Collection
    {
        return $project->amendments()
            ->visibleToClient()
            ->with('createdBy:id,first_name,last_name')
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * @return list<ContractAmendmentStatus>
     */
    private function allowedTransitions(ContractAmendmentStatus $current, bool $asClient): array
    {
        if ($asClient) {
            return match ($current) {
                ContractAmendmentStatus::PendingClient => [
                    ContractAmendmentStatus::Validated,
                    ContractAmendmentStatus::Refused,
                ],
                default => [],
            };
        }

        return match ($current) {
            ContractAmendmentStatus::Draft => [
                ContractAmendmentStatus::PendingClient,
                ContractAmendmentStatus::Validated,
                ContractAmendmentStatus::Refused,
            ],
            ContractAmendmentStatus::PendingClient => [
                ContractAmendmentStatus::Validated,
                ContractAmendmentStatus::Refused,
            ],
            default => [],
        };
    }

    private function assertMutable(ContractAmendment $amendment): void
    {
        if (! $amendment->isMutable()) {
            throw ValidationException::withMessages([
                'status' => ['Seuls les avenants en brouillon peuvent être modifiés ou supprimés.'],
            ]);
        }
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function storeFile(UploadedFile $file, int $companyId): array
    {
        $originalName = $file->getClientOriginalName();
        $filename = Str::uuid()->toString().'_'.$originalName;
        $path = $file->storeAs("amendments/{$companyId}", $filename, 'local');

        return [$path, $originalName];
    }
}
