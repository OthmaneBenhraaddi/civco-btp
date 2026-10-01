<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Requests\Document\StoreLibraryDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Client;
use App\Models\Company;
use App\Models\Document;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Quote;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\DocumentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly DocumentService $documentService,
        private readonly ActivityLogService $activityLogService,
    ) {}

    public function library(Request $request): AnonymousResourceCollection
    {
        $companyId = $this->companyId($request);
        $projectType = (new Project)->getMorphClass();
        $companyType = (new Company)->getMorphClass();

        $query = Document::query()
            ->forCompany($companyId)
            ->whereIn('documentable_type', [$projectType, $companyType])
            ->with(['uploadedBy', 'documentType', 'documentable'])
            ->orderByDesc('created_at');

        $this->limitLibraryToPortalClient($query, $request, $projectType);

        $status = $request->string('status')->trim()->toString();

        if ($status === 'active') {
            $query->where('status', 'active');
        } elseif ($status === 'archived') {
            $query->where('status', 'archived');
        }

        if ($request->filled('project_id')) {
            $query->where('documentable_type', $projectType)
                ->where('documentable_id', $request->integer('project_id'));
        }

        return DocumentResource::collection(
            $query->paginate($request->integer('per_page', 50))->withQueryString()
        );
    }

    public function storeLibrary(StoreLibraryDocumentRequest $request): JsonResponse
    {
        $project = null;

        if ($request->filled('project_id')) {
            $project = $this->projectInCompany($request, $request->integer('project_id'));
        }

        $document = $project
            ? $this->documentService->storeForProject(
                $project,
                $request->file('file'),
                $request->user(),
                $request->integer('document_type_id'),
            )
            : $this->documentService->storeFor(
                $this->company($request),
                $request->file('file'),
                $request->user(),
                $this->companyId($request),
                $request->integer('document_type_id'),
            );

        $document->load(['uploadedBy', 'documentType', 'documentable']);

        if ($project !== null) {
            $this->activityLogService->logDocumentUploaded($project, $document);
        }

        return (new DocumentResource($document))
            ->response()
            ->setStatusCode(201);
    }

    public function assignProject(Request $request, Document $document): DocumentResource
    {
        $this->ensureDocumentBelongsToCompany($request, $document);

        $projectId = $request->integer('project_id');

        if ($projectId <= 0) {
            abort(422, 'Choisissez un projet.');
        }

        $project = $this->projectInCompany($request, $projectId);
        $document = $this->documentService->assignToProject($document, $project);
        $document->load(['uploadedBy', 'documentType', 'documentable']);
        $this->activityLogService->logDocumentUploaded($project, $document);

        return new DocumentResource($document);
    }

    public function index(Request $request, Project $project): AnonymousResourceCollection
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $query = $project->documents()
            ->with(['uploadedBy', 'documentType'])
            ->orderByDesc('created_at');

        $status = $request->string('status')->trim()->toString();

        if ($status === 'active') {
            $query->where('status', 'active');
        } elseif ($status === 'archived') {
            $query->where('status', 'archived');
        }

        return DocumentResource::collection($query->get());
    }

    public function store(StoreDocumentRequest $request, Project $project): JsonResponse
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $document = $this->documentService->storeForProject(
            $project,
            $request->file('file'),
            $request->user(),
            $request->integer('document_type_id'),
        );

        $document->load(['uploadedBy', 'documentType']);
        $this->activityLogService->logDocumentUploaded($project, $document);

        return (new DocumentResource($document))
            ->response()
            ->setStatusCode(201);
    }

    public function download(Request $request, Document $document): StreamedResponse
    {
        $this->ensureDocumentBelongsToCompany($request, $document);
        $this->ensureFileExists($document);

        return Storage::disk('local')->download(
            $document->storage_path,
            $document->original_filename,
        );
    }

    public function preview(Request $request, Document $document): StreamedResponse
    {
        $this->ensureDocumentBelongsToCompany($request, $document);
        $this->ensureFileExists($document);

        return Storage::disk('local')->response(
            $document->storage_path,
            $document->original_filename,
            ['Content-Disposition' => 'inline; filename="'.$document->original_filename.'"'],
        );
    }

    public function detach(Request $request, Document $document): DocumentResource
    {
        $this->ensureDocumentBelongsToCompany($request, $document);

        $document = $this->documentService->detachFromProject($document, $this->company($request));

        return new DocumentResource($document->load(['uploadedBy', 'documentType', 'documentable']));
    }

    public function destroy(Request $request, Document $document): JsonResponse
    {
        $this->ensureDocumentBelongsToCompany($request, $document);

        $this->documentService->deleteFile($document);
        $document->delete();

        return response()->json(null, 204);
    }

    public function archive(Request $request, Document $document): DocumentResource
    {
        $this->ensureDocumentBelongsToCompany($request, $document);

        $document = $this->documentService->archive($document);

        return new DocumentResource($document->load('uploadedBy'));
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ((int) $project->company_id !== $this->companyId($request)) {
            abort(404);
        }

        $user = $request->user();

        if ($user instanceof User && $user->isClientPortalUser() && (int) $project->client_id !== (int) $user->client_id) {
            abort(404);
        }
    }

    private function ensureDocumentBelongsToCompany(Request $request, Document $document): void
    {
        if ((int) $document->company_id !== $this->companyId($request)) {
            abort(404);
        }

        $user = $request->user();

        if ($user instanceof User && $user->isClientPortalUser() && ! $this->portalUserCanSee($user, $document)) {
            abort(404);
        }
    }

    private function ensureFileExists(Document $document): void
    {
        if (! Storage::disk('local')->exists($document->storage_path)) {
            abort(404, 'File not found.');
        }
    }

    private function projectInCompany(Request $request, int $projectId): Project
    {
        $project = Project::query()
            ->forCompany($this->companyId($request))
            ->find($projectId);

        if ($project === null) {
            abort(422, 'Ce projet n\'appartient pas à votre entité.');
        }

        $this->ensureProjectBelongsToCompany($request, $project);

        return $project;
    }

    private function limitLibraryToPortalClient($query, Request $request, string $projectType): void
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->isClientPortalUser()) {
            return;
        }

        $projectIds = Project::query()
            ->forCompany($this->companyId($request))
            ->where('client_id', $user->client_id)
            ->select('id');

        $query->where('documentable_type', $projectType)
            ->whereIn('documentable_id', $projectIds);
    }

    private function portalUserCanSee(User $user, Document $document): bool
    {
        $document->loadMissing('documentable');
        $parent = $document->documentable;

        if ($parent instanceof Project || $parent instanceof Quote || $parent instanceof Invoice) {
            return (int) $parent->client_id === (int) $user->client_id;
        }

        if ($parent instanceof Client) {
            return (int) $parent->id === (int) $user->client_id;
        }

        return false;
    }
}
