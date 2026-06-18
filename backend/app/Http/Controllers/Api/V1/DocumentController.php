<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Document\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\Project;
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
    ) {}

    public function index(Request $request, Project $project): AnonymousResourceCollection
    {
        $this->ensureProjectBelongsToCompany($request, $project);

        $query = $project->documents()
            ->with('uploadedBy')
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
            $request->input('category'),
        );

        return (new DocumentResource($document->load('uploadedBy')))
            ->response()
            ->setStatusCode(201);
    }

    public function download(Request $request, Document $document): StreamedResponse
    {
        $this->ensureDocumentBelongsToCompany($request, $document);

        if (! Storage::disk('local')->exists($document->storage_path)) {
            abort(404, 'File not found.');
        }

        return Storage::disk('local')->download(
            $document->storage_path,
            $document->original_filename,
        );
    }

    public function archive(Request $request, Document $document): DocumentResource
    {
        $this->ensureDocumentBelongsToCompany($request, $document);

        $document = $this->documentService->archive($document);

        return new DocumentResource($document->load('uploadedBy'));
    }

    private function ensureProjectBelongsToCompany(Request $request, Project $project): void
    {
        if ($project->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureDocumentBelongsToCompany(Request $request, Document $document): void
    {
        if ($document->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
