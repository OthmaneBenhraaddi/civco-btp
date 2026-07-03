<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\CompileContractRequest;
use App\Http\Requests\Contract\StoreContractTemplateRequest;
use App\Http\Requests\Contract\SubmitContractSignatureRequest;
use App\Http\Requests\Contract\UpdateContractTemplateRequest;
use App\Http\Resources\ContractResource;
use App\Http\Resources\ContractTemplateResource;
use App\Models\Contract;
use App\Models\ContractTemplate;
use App\Models\Project;
use App\Services\ContractCompilationService;
use App\Enums\ContractStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ContractTemplateController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        return ContractTemplateResource::collection(
            ContractTemplate::query()
                ->orderBy('title')
                ->get()
        );
    }

    public function store(StoreContractTemplateRequest $request): JsonResponse
    {
        $tenantId = $this->resolveTenantIdForCompany($request);

        $template = ContractTemplate::query()->create([
            ...$request->validated(),
            'tenant_id' => $tenantId,
        ]);

        return (new ContractTemplateResource($template))
            ->response()
            ->setStatusCode(201);
    }

    public function show(ContractTemplate $contractTemplate): ContractTemplateResource
    {
        return new ContractTemplateResource($contractTemplate);
    }

    public function update(
        UpdateContractTemplateRequest $request,
        ContractTemplate $contractTemplate,
    ): ContractTemplateResource {
        $contractTemplate->update($request->validated());

        return new ContractTemplateResource($contractTemplate->fresh());
    }

    public function destroy(ContractTemplate $contractTemplate): JsonResponse
    {
        $contractTemplate->delete();

        return response()->json(['message' => 'Template deleted.']);
    }

    public function preview(
        Request $request,
        ContractTemplate $contractTemplate,
        ContractCompilationService $compilationService,
    ): JsonResponse {
        $projectId = $request->integer('project_id');

        if ($projectId === 0) {
            return response()->json([
                'content' => $contractTemplate->content,
                'context' => null,
            ]);
        }

        $project = Project::query()
            ->forCompany($this->companyId($request))
            ->findOrFail($projectId);

        return response()->json([
            'content' => $compilationService->compileTemplateContent($contractTemplate->content, $project),
            'context' => $compilationService->documentContext($project),
        ]);
    }

    private function resolveTenantIdForCompany(Request $request): ?int
    {
        if (function_exists('current_tenant')) {
            $tenant = current_tenant();

            if ($tenant !== null) {
                return $tenant->id;
            }
        }

        $user = $request->user();

        return $user?->tenant_id;
    }
}
