<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\DocumentTemplate\StoreDocumentTemplateRequest;
use App\Http\Requests\DocumentTemplate\UpdateDocumentTemplateRequest;
use App\Http\Resources\DocumentTemplateResource;
use App\Models\Client;
use App\Models\DocumentTemplate;
use App\Models\Project;
use App\Services\DocumentTemplateCompilationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class DocumentTemplateController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly DocumentTemplateCompilationService $compilationService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $this->assertTenantAdmin($request);

        $query = DocumentTemplate::query()->orderBy('name');

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        return DocumentTemplateResource::collection($query->get());
    }

    public function store(StoreDocumentTemplateRequest $request): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);

        if ($tenantId === null) {
            throw new AccessDeniedHttpException('Aucune entité active pour créer un template.');
        }

        $count = $this->compilationService->countForTenant($tenantId);

        if ($count >= DocumentTemplate::MAX_PER_TENANT) {
            return response()->json([
                'message' => 'Limite de 10 templates atteinte pour votre entité.',
                'limit' => DocumentTemplate::MAX_PER_TENANT,
                'count' => $count,
            ], 422);
        }

        $template = DocumentTemplate::query()->create([
            ...$request->validated(),
            'tenant_id' => $tenantId,
        ]);

        return (new DocumentTemplateResource($template))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, DocumentTemplate $documentTemplate): DocumentTemplateResource
    {
        $this->assertTenantAdmin($request);

        return new DocumentTemplateResource($documentTemplate);
    }

    public function update(
        UpdateDocumentTemplateRequest $request,
        DocumentTemplate $documentTemplate,
    ): DocumentTemplateResource {
        $documentTemplate->update($request->validated());

        return new DocumentTemplateResource($documentTemplate->fresh());
    }

    public function destroy(Request $request, DocumentTemplate $documentTemplate): JsonResponse
    {
        $this->assertTenantAdmin($request);

        $documentTemplate->delete();

        return response()->json(['message' => 'Template deleted.']);
    }

    public function placeholders(Request $request): JsonResponse
    {
        $this->assertTenantAdmin($request);

        return response()->json([
            'data' => $this->compilationService->availablePlaceholders(),
            'limit' => DocumentTemplate::MAX_PER_TENANT,
        ]);
    }

    public function preview(
        Request $request,
        DocumentTemplate $documentTemplate,
    ): JsonResponse {
        $this->assertTenantAdmin($request);

        $client = null;
        $project = null;

        if ($request->filled('project_id')) {
            $project = Project::query()
                ->forCompany($this->companyId($request))
                ->with(['client', 'company', 'tenant'])
                ->findOrFail($request->integer('project_id'));
        }

        if ($request->filled('client_id')) {
            $client = Client::query()
                ->forCompany($this->companyId($request))
                ->findOrFail($request->integer('client_id'));
        }

        $companyName = $request->user()?->primaryCompany()?->name;

        return response()->json([
            'content' => $this->compilationService->compileTemplate(
                $documentTemplate,
                $client,
                $project,
                $documentTemplate->tenant,
                $companyName,
            ),
            'placeholders' => $this->compilationService->availablePlaceholders(),
        ]);
    }

    private function assertTenantAdmin(Request $request): void
    {
        $user = $request->user();

        if ($user === null || ! $user->isAdmin() || $user->tenant_id === null) {
            throw new AccessDeniedHttpException('Action réservée aux administrateurs d\'entité.');
        }
    }

    private function resolveTenantId(Request $request): ?int
    {
        if (function_exists('current_tenant')) {
            $tenant = current_tenant();

            if ($tenant !== null) {
                return (int) $tenant->id;
            }
        }

        return $request->user()?->tenant_id !== null
            ? (int) $request->user()->tenant_id
            : null;
    }
}
