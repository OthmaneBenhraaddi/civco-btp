<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContractAmendmentStatus;
use App\Enums\ContractStatus;
use App\Http\Controllers\Concerns\ResolvesClientPortalAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\ClientPortal\StoreProjectCommentRequest;
use App\Http\Requests\Contract\SubmitContractSignatureRequest;
use App\Http\Requests\ContractAmendment\UpdateContractAmendmentStatusRequest;
use App\Http\Resources\ClientPortalMilestoneResource;
use App\Http\Resources\ClientPortalProjectResource;
use App\Http\Resources\ContractAmendmentResource;
use App\Http\Resources\ContractResource;
use App\Http\Resources\ProjectCommentResource;
use App\Http\Resources\ProjectMediaResource;
use App\Models\Contract;
use App\Models\ContractAmendment;
use App\Models\Project;
use App\Services\ClientPortalService;
use App\Services\ContractAmendmentService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientPortalController extends Controller
{
    use ResolvesClientPortalAccess;

    public function __construct(
        private readonly ClientPortalService $clientPortalService,
        private readonly ContractAmendmentService $amendmentService,
        private readonly NotificationService $notificationService,
    ) {}

    public function projects(Request $request): AnonymousResourceCollection
    {
        $client = $this->resolveClientForUser($request);

        return ClientPortalProjectResource::collection(
            $this->clientPortalService->activeProjectsForClient($client)
        );
    }

    public function milestones(Request $request, Project $project): AnonymousResourceCollection
    {
        $project = $this->resolveProjectForClient($request, $project);

        return ClientPortalMilestoneResource::collection(
            $this->clientPortalService->upcomingMilestonesForProject($project)
        );
    }

    public function media(Request $request, Project $project): AnonymousResourceCollection
    {
        $project = $this->resolveProjectForClient($request, $project);

        return ProjectMediaResource::collection(
            $this->clientPortalService->mediaFeedForProject($project)
        );
    }

    public function comments(Request $request, Project $project): AnonymousResourceCollection
    {
        $project = $this->resolveProjectForClient($request, $project);

        return ProjectCommentResource::collection(
            $this->clientPortalService->commentsForProject($project)
        );
    }

    public function storeComment(
        StoreProjectCommentRequest $request,
        Project $project,
    ): JsonResponse {
        $project = $this->resolveProjectForClient($request, $project);

        $comment = $this->clientPortalService->storeComment(
            $project,
            $request->user(),
            $request->validated('content'),
        );

        return (new ProjectCommentResource($comment))
            ->response()
            ->setStatusCode(201);
    }

    public function contract(Request $request, Project $project): ContractResource|JsonResponse
    {
        $project = $this->resolveProjectForClient($request, $project);

        $contract = Contract::query()
            ->where('project_id', $project->id)
            ->orderByDesc('created_at')
            ->first();

        if ($contract === null) {
            return response()->json(['message' => 'Aucun contrat disponible pour ce projet.'], 404);
        }

        $contract->load(['project:id,title,reference', 'client:id,name']);

        return new ContractResource($contract);
    }

    public function signContract(
        SubmitContractSignatureRequest $request,
        Project $project,
    ): ContractResource {
        $project = $this->resolveProjectForClient($request, $project);

        $contract = Contract::query()
            ->where('project_id', $project->id)
            ->orderByDesc('created_at')
            ->firstOrFail();

        if ($contract->status !== ContractStatus::Draft) {
            abort(422, 'Ce contrat ne peut plus être signé par le client.');
        }

        if ($contract->client_signature_data !== null) {
            abort(422, 'Vous avez déjà signé ce contrat.');
        }

        $contract->update([
            'client_signature_data' => $request->validated('signature_data'),
            'client_signed_at' => now(),
            'status' => ContractStatus::SignedByClient,
        ]);

        $fresh = $contract->fresh()->load(['project:id,title,reference', 'client:id,name']);

        if ($fresh->tenant_id !== null) {
            $this->notificationService->notifyContractSigned($fresh, $request->user());
        }

        return new ContractResource($fresh);
    }

    public function amendments(Request $request, Project $project): AnonymousResourceCollection
    {
        $project = $this->resolveProjectForClient($request, $project);

        return ContractAmendmentResource::collection(
            $this->amendmentService->visibleToClient($project),
        );
    }

    public function respondToAmendment(
        UpdateContractAmendmentStatusRequest $request,
        ContractAmendment $amendment,
    ): ContractAmendmentResource {
        $amendment->loadMissing('project');

        if ($amendment->project === null) {
            abort(404);
        }

        $this->resolveProjectForClient($request, $amendment->project);

        $status = ContractAmendmentStatus::from($request->validated('status'));

        if (! in_array($status, [
            ContractAmendmentStatus::Validated,
            ContractAmendmentStatus::Refused,
        ], true)) {
            abort(422, 'Le client ne peut qu\'accepter ou refuser un avenant.');
        }

        $amendment = $this->amendmentService->transition($amendment, $status, asClient: true);

        return new ContractAmendmentResource($amendment);
    }
}
