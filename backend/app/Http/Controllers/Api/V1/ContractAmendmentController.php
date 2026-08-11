<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContractAmendmentStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\ContractAmendment\StoreContractAmendmentRequest;
use App\Http\Requests\ContractAmendment\UpdateContractAmendmentRequest;
use App\Http\Requests\ContractAmendment\UpdateContractAmendmentStatusRequest;
use App\Http\Resources\ContractAmendmentResource;
use App\Http\Resources\ProjectResource;
use App\Models\ContractAmendment;
use App\Models\Project;
use App\Services\ContractAmendmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContractAmendmentController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly ContractAmendmentService $amendmentService,
    ) {}

    public function index(Request $request, Project $project): AnonymousResourceCollection
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $amendments = $project->amendments()
            ->with(['createdBy:id,first_name,last_name', 'contract:id,title,status'])
            ->orderByDesc('created_at')
            ->get();

        return ContractAmendmentResource::collection($amendments);
    }

    public function store(StoreContractAmendmentRequest $request, Project $project): JsonResponse
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $amendment = $this->amendmentService->create(
            $project,
            $request->safe()->except(['file']),
            $request->user(),
            $request->file('file'),
        );

        return (new ContractAmendmentResource(
            $amendment->load(['createdBy:id,first_name,last_name', 'contract:id,title,status']),
        ))->response()->setStatusCode(201);
    }

    public function update(
        UpdateContractAmendmentRequest $request,
        ContractAmendment $amendment,
    ): ContractAmendmentResource {
        $this->ensureAmendmentBelongsToCompany($request, $amendment);

        $amendment = $this->amendmentService->update(
            $amendment,
            $request->safe()->except(['file']),
            $request->file('file'),
        );

        return new ContractAmendmentResource($amendment);
    }

    public function updateStatus(
        UpdateContractAmendmentStatusRequest $request,
        ContractAmendment $amendment,
    ): JsonResponse {
        $this->ensureAmendmentBelongsToCompany($request, $amendment);

        $amendment = $this->amendmentService->transition(
            $amendment,
            ContractAmendmentStatus::from($request->validated('status')),
        );

        $project = $amendment->project?->load(['client', 'lots', 'amendments']);

        return response()->json([
            'data' => (new ContractAmendmentResource($amendment))->resolve(),
            'project' => $project ? (new ProjectResource($project))->resolve() : null,
        ]);
    }

    public function destroy(Request $request, ContractAmendment $amendment): JsonResponse
    {
        $this->ensureAmendmentBelongsToCompany($request, $amendment);

        $this->amendmentService->delete($amendment);

        return response()->json(['message' => 'Avenant supprimé.']);
    }

    public function download(Request $request, ContractAmendment $amendment): StreamedResponse
    {
        $this->ensureAmendmentBelongsToCompany($request, $amendment);

        if (! $amendment->hasFile() || ! Storage::disk('local')->exists($amendment->file_path)) {
            abort(404, 'Fichier introuvable.');
        }

        return Storage::disk('local')->download(
            $amendment->file_path,
            $amendment->original_filename ?: 'avenant.pdf',
        );
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureAmendmentBelongsToCompany(Request $request, ContractAmendment $amendment): void
    {
        $amendment->loadMissing('project');

        if ($amendment->project === null || $amendment->project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
