<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\WorkspaceTask\StoreWorkspaceTaskRequest;
use App\Http\Requests\WorkspaceTask\UpdateWorkspaceTaskRequest;
use App\Http\Resources\WorkspaceTaskResource;
use App\Models\Project;
use App\Models\WorkspaceTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class WorkspaceTaskController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = WorkspaceTask::query()
            ->forCompany($this->companyId($request))
            ->with('files')
            ->orderByDesc('updated_at');

        if ($projectId = $request->integer('project_id')) {
            $query->where('project_id', $projectId);
        }

        if ($statut = $request->string('statut')->trim()->toString()) {
            $query->where('statut', $statut);
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('nom', 'like', "%{$search}%")
                    ->orWhere('responsable_name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        return WorkspaceTaskResource::collection($query->get());
    }

    public function store(StoreWorkspaceTaskRequest $request): JsonResponse
    {
        $project = Project::query()
            ->forCompany($this->companyId($request))
            ->findOrFail($request->integer('project_id'));

        $task = DB::transaction(function () use ($request, $project): WorkspaceTask {
            $validated = $request->validated();
            $files = $validated['fichiers'] ?? [];
            unset($validated['fichiers']);

            $user = $request->user();
            $avatarSeed = rawurlencode($validated['responsable_name']);

            $task = WorkspaceTask::query()->create([
                ...$validated,
                'company_id' => $this->companyId($request),
                'project_name' => $project->title,
                'responsable_avatar_url' => "https://api.dicebear.com/7.x/initials/svg?seed={$avatarSeed}&backgroundColor=6366f1",
                'statut' => $validated['statut'] ?? 'non_commence',
                'priorite' => $validated['priorite'] ?? 'moyenne',
                'budget' => $validated['budget'] ?? 0,
                'last_updated_by_user_id' => $user?->id,
                'last_updated_by_name' => $user?->full_name,
            ]);

            foreach (array_values($files) as $filename) {
                $task->files()->create(['filename' => $filename]);
            }

            return $task;
        });

        return (new WorkspaceTaskResource($task->load('files')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateWorkspaceTaskRequest $request, WorkspaceTask $workspaceTask): WorkspaceTaskResource
    {
        $this->ensureTaskBelongsToCompany($request, $workspaceTask);

        DB::transaction(function () use ($request, $workspaceTask): void {
            $validated = $request->validated();
            $files = $validated['fichiers'] ?? null;
            unset($validated['fichiers']);

            if ($files !== null) {
                $workspaceTask->files()->delete();

                foreach (array_values($files) as $filename) {
                    $workspaceTask->files()->create(['filename' => $filename]);
                }
            }

            if (isset($validated['responsable_name'])) {
                $seed = rawurlencode($validated['responsable_name']);
                $validated['responsable_avatar_url'] = "https://api.dicebear.com/7.x/initials/svg?seed={$seed}&backgroundColor=6366f1";
            }

            $user = $request->user();
            $validated['last_updated_by_user_id'] = $user?->id;
            $validated['last_updated_by_name'] = $user?->full_name;

            $workspaceTask->update($validated);
        });

        return new WorkspaceTaskResource($workspaceTask->fresh()->load('files'));
    }

    public function destroy(Request $request, WorkspaceTask $workspaceTask): JsonResponse
    {
        $this->ensureTaskBelongsToCompany($request, $workspaceTask);

        $workspaceTask->delete();

        return response()->json(['message' => 'Task deleted.']);
    }

    private function ensureTaskBelongsToCompany(Request $request, WorkspaceTask $task): void
    {
        if ($task->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
