<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectPhaseRequest;
use App\Http\Requests\Project\UpdateProjectPhaseRequest;
use App\Http\Resources\ProjectPhaseResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Services\ProjectProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectPhaseController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly ProjectProgressService $progressService,
    ) {}

    public function index(Request $request, Project $project)
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        return ProjectPhaseResource::collection(
            $project->phases()->with('tasks.assignedTo')->get()
        );
    }

    public function store(StoreProjectPhaseRequest $request, Project $project): JsonResponse
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $sortOrder = $request->input('sort_order', ($project->phases()->max('sort_order') ?? 0) + 1);

        $phase = $project->phases()->create([
            ...$request->validated(),
            'sort_order' => $sortOrder,
        ]);

        return (new ProjectPhaseResource($phase->load('tasks.assignedTo')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateProjectPhaseRequest $request, ProjectPhase $phase): ProjectPhaseResource
    {
        $this->ensurePhaseBelongsToCompany($request, $phase);

        $phase->update($request->validated());

        if ($request->has('progress_percent')) {
            $this->progressService->rollupProject($phase->project);
        }

        return new ProjectPhaseResource($phase->fresh()->load('tasks.assignedTo'));
    }

    public function destroy(Request $request, ProjectPhase $phase): JsonResponse
    {
        $this->ensurePhaseBelongsToCompany($request, $phase);

        $project = $phase->project;
        $phase->delete();
        $this->progressService->rollupProject($project);

        return response()->json(['message' => 'Phase deleted.']);
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensurePhaseBelongsToCompany(Request $request, ProjectPhase $phase): void
    {
        $phase->loadMissing('project');

        if ($phase->project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
