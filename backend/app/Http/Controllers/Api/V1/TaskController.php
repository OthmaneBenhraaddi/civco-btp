<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TaskStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreTaskRequest;
use App\Http\Requests\Project\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\ProjectPhase;
use App\Models\Task;
use App\Services\ProjectProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly ProjectProgressService $progressService,
    ) {}

    public function store(StoreTaskRequest $request, ProjectPhase $phase): JsonResponse
    {
        $this->ensurePhaseBelongsToCompany($request, $phase);

        $sortOrder = $request->input('sort_order', ($phase->tasks()->max('sort_order') ?? 0) + 1);

        $task = $phase->tasks()->create([
            ...$request->validated(),
            'sort_order' => $sortOrder,
            'status' => $request->input('status', TaskStatus::Todo->value),
        ]);

        $this->progressService->rollupFromTask($task);

        return (new TaskResource($task->load('assignedTo')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateTaskRequest $request, Task $task): TaskResource
    {
        $this->ensureTaskBelongsToCompany($request, $task);

        $payload = $request->validated();

        if (isset($payload['status']) && $payload['status'] === TaskStatus::Done->value) {
            $payload['completed_at'] = now();
            $payload['progress_percent'] = $payload['progress_percent'] ?? 100;
        }

        $task->update($payload);
        $this->progressService->rollupFromTask($task);

        return new TaskResource($task->fresh()->load('assignedTo'));
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->ensureTaskBelongsToCompany($request, $task);

        $phase = $task->phase;
        $task->delete();
        $this->progressService->rollupPhase($phase);
        $this->progressService->rollupProject($phase->project);

        return response()->json(['message' => 'Task deleted.']);
    }

    private function ensurePhaseBelongsToCompany(Request $request, ProjectPhase $phase): void
    {
        $phase->loadMissing('project');

        if ($phase->project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureTaskBelongsToCompany(Request $request, Task $task): void
    {
        $task->loadMissing('phase.project');

        if ($task->phase->project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
