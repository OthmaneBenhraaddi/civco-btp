<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Concerns\ResolvesUserAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Lot;
use App\Models\Project;
use App\Services\ProjectReferenceService;
use App\Services\SiteGeocodingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    use ResolvesCompanyContext;
    use ResolvesUserAccess;

    public function __construct(
        private readonly ProjectReferenceService $referenceService,
        private readonly SiteGeocodingService $geocodingService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Project::query()
            ->forCompany($this->companyId($request))
            ->with(['client:id,name', 'lots'])
            ->orderByDesc('created_at');

        $query = $this->applyProjectVisibilityScope($query, $request);

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

        if ($request->boolean('map')) {
            $query
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->whereIn('status', [
                    ProjectStatus::Planned->value,
                    ProjectStatus::InProgress->value,
                    ProjectStatus::OnHold->value,
                ]);

            return ProjectResource::collection($query->get());
        }

        return ProjectResource::collection(
            $query->paginate($request->integer('per_page', 15))->withQueryString()
        );
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = DB::transaction(function () use ($request): Project {
            $validated = $request->validated();
            $lotIds = $validated['lot_ids'] ?? [];
            unset($validated['lot_ids']);

            $this->applySiteLocation($validated);

            $project = Project::query()->create([
                ...$validated,
                'company_id' => $this->companyId($request),
                'reference' => $this->referenceService->nextForCompany($this->companyId($request)),
                'status' => $request->input('status', ProjectStatus::Planned->value),
            ]);

            $this->syncProjectLots($request, $project, $lotIds);

            return $project;
        });

        return (new ProjectResource($project->load(['client', 'lots'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Project $project): ProjectResource
    {
        $this->ensureProjectAccessibleToUser($request, $project);

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
        $this->ensureProjectAccessibleToUser($request, $project);

        $validated = $request->validated();
        $lotIds = $validated['lot_ids'] ?? null;
        unset($validated['lot_ids']);

        DB::transaction(function () use ($request, $project, $validated, $lotIds): void {
            $this->applySiteLocation($validated, $project);
            $project->update($validated);

            if (is_array($lotIds)) {
                $this->syncProjectLots($request, $project, $lotIds);
            }
        });

        return new ProjectResource($project->fresh()->load(['client', 'lots']));
    }

    public function destroy(Request $request, Project $project): JsonResponse
    {
        $this->ensureProjectAccessibleToUser($request, $project);

        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    /**
     * @param  array<int, int>  $lotIds
     */
    /**
     * @param  array<string, mixed>  $validated
     */
    private function applySiteLocation(array &$validated, ?Project $existing = null): void
    {
        $hasAddressInput = array_key_exists('site_address_line1', $validated)
            || array_key_exists('site_city', $validated)
            || array_key_exists('site_postal_code', $validated);

        if (! $hasAddressInput && $existing === null) {
            return;
        }

        $line1 = $validated['site_address_line1'] ?? $existing?->site_address_line1;
        $city = $validated['site_city'] ?? $existing?->site_city;
        $postalCode = $validated['site_postal_code'] ?? $existing?->site_postal_code;

        $localParts = array_filter([
            $line1,
            trim(implode(' ', array_filter([$postalCode, $city]))),
        ]);

        if ($localParts === []) {
            $validated['site_address'] = null;
            $validated['latitude'] = null;
            $validated['longitude'] = null;

            return;
        }

        $geocoded = $this->geocodingService->resolveFromParts($line1, $city, $postalCode);

        if ($geocoded !== null) {
            $validated = array_merge($validated, $geocoded);

            return;
        }

        $validated['site_address'] = implode(', ', $localParts);

        if ($hasAddressInput) {
            $validated['latitude'] = null;
            $validated['longitude'] = null;
        }
    }

    private function syncProjectLots(Request $request, Project $project, array $lotIds): void
    {
        $companyId = $this->companyId($request);

        $validLotIds = Lot::query()
            ->forCompany($companyId)
            ->whereIn('id', $lotIds)
            ->pluck('id')
            ->all();

        $project->lots()->sync($validLotIds);
    }
}
