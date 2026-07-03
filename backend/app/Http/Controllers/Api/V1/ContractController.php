<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ContractStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\CompileContractRequest;
use App\Http\Requests\Contract\SubmitContractSignatureRequest;
use App\Http\Resources\ContractResource;
use App\Models\Contract;
use App\Models\ContractTemplate;
use App\Models\Project;
use App\Services\ContractCompilationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ContractController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly ContractCompilationService $compilationService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Contract::query()
            ->with(['project:id,title,reference', 'client:id,name'])
            ->orderByDesc('created_at');

        if ($projectId = $request->integer('project_id')) {
            $query->where('project_id', $projectId);
        }

        if ($status = $request->string('status')->trim()->toString()) {
            $query->where('status', $status);
        }

        return ContractResource::collection($query->paginate($request->integer('per_page', 20)));
    }

    public function show(Contract $contract): ContractResource
    {
        $contract->load(['project:id,title,reference', 'client:id,name']);

        return new ContractResource($contract);
    }

    public function compile(CompileContractRequest $request): JsonResponse
    {
        $template = ContractTemplate::query()->findOrFail($request->integer('contract_template_id'));

        $project = Project::query()
            ->forCompany($this->companyId($request))
            ->findOrFail($request->integer('project_id'));

        $contract = $this->compilationService->createContractFromTemplate($template, $project);
        $contract->load(['project:id,title,reference', 'client:id,name']);

        return (new ContractResource($contract))
            ->response()
            ->setStatusCode(201);
    }

    public function submitTenantSignature(
        SubmitContractSignatureRequest $request,
        Contract $contract,
    ): ContractResource {
        $this->ensureContractBelongsToCompany($request, $contract);

        if ($contract->status !== ContractStatus::SignedByClient) {
            abort(422, 'Le contrat doit être signé par le client avant la signature entité.');
        }

        if ($contract->tenant_signature_data !== null) {
            abort(422, 'Ce contrat a déjà été signé par l\'entité.');
        }

        $contract->update([
            'tenant_signature_data' => $request->validated('signature_data'),
            'tenant_signed_at' => now(),
            'status' => ContractStatus::FullyExecuted,
        ]);

        return new ContractResource($contract->fresh()->load(['project:id,title,reference', 'client:id,name']));
    }

    private function ensureContractBelongsToCompany(Request $request, Contract $contract): void
    {
        $project = Project::query()->find($contract->project_id);

        if ($project === null || $project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
