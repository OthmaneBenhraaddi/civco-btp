<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\ProjectReferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly ProjectReferenceService $referenceService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Project::query()
            ->forCompany($this->companyId($request))
            ->with(['client:id,name', 'lots'])
            ->orderByDesc('created_at');

        if ($status = $request->string('status')->trim()->toString()) {
            $query->where('status', $status);
        }

        if ($clientId = $request->integer('client_id')) {
            $query->where('client_id', $clientId);
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        return ProjectResource::collection(
            $query->paginate($request->integer('per_page', 15))->withQueryString()
        );
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = DB::transaction(function () use ($request): Project {
            $validated = $request->validated();
            $lots = $validated['lots'] ?? [];
            unset($validated['lots']);

            $project = Project::query()->create([
                ...$validated,
                'company_id' => $this->companyId($request),
                'reference' => $this->referenceService->nextForCompany($this->companyId($request)),
                'status' => $request->input('status', ProjectStatus::Planned->value),
            ]);

            foreach (array_values($lots) as $index => $lotName) {
                $project->lots()->create([
                    'lot_name' => $lotName,
                    'sort_order' => $index,
                ]);
            }

            return $project;
        });

        return (new ProjectResource($project->load(['client', 'lots'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Project $project): ProjectResource
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        return new ProjectResource(
            $project->load([
                'client',
                'lots',
                'phases.tasks.assignedTo',
                'teamMembers',
                'progressSnapshots.recordedBy',
            ])
        );
    }

    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $validated = $request->validated();
        $lots = $validated['lots'] ?? null;
        unset($validated['lots']);

        DB::transaction(function () use ($project, $validated, $lots): void {
            $project->update($validated);

            if ($lots !== null) {
                $project->lots()->delete();

                foreach (array_values($lots) as $index => $lotName) {
                    $project->lots()->create([
                        'lot_name' => $lotName,
                        'sort_order' => $index,
                    ]);
                }
            }
        });

        return new ProjectResource($project->fresh()->load(['client', 'lots']));
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
