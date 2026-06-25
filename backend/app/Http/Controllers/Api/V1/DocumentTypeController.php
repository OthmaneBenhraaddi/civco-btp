<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentTypeResource;
use App\Models\Document;
use App\Models\DocumentType;
use App\Services\DocumentTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DocumentTypeController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly DocumentTypeService $documentTypeService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $companyId = $this->companyId($request);
        $this->documentTypeService->ensureDefaultsForCompany($companyId);

        $query = DocumentType::query()
            ->forCompany($companyId)
            ->withCount('documents')
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        return DocumentTypeResource::collection($query->get());
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('document_types', 'name')->where('company_id', $companyId),
            ],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $maxSort = DocumentType::query()->forCompany($companyId)->max('sort_order');

        $documentType = DocumentType::query()->create([
            'company_id' => $companyId,
            'name' => $validated['name'],
            'sort_order' => $validated['sort_order'] ?? ((int) $maxSort + 10),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return (new DocumentTypeResource($documentType->loadCount('documents')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, DocumentType $documentType): DocumentTypeResource
    {
        $this->ensureDocumentTypeBelongsToCompany($request, $documentType);

        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('document_types', 'name')
                    ->where('company_id', $companyId)
                    ->ignore($documentType->id),
            ],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $documentType->update($validated);

        return new DocumentTypeResource($documentType->fresh()->loadCount('documents'));
    }

    public function destroy(Request $request, DocumentType $documentType): JsonResponse
    {
        $this->ensureDocumentTypeBelongsToCompany($request, $documentType);

        $validated = $request->validate([
            'reassign_to' => [
                'nullable',
                'integer',
                Rule::exists('document_types', 'id')->where('company_id', $this->companyId($request)),
            ],
        ]);

        $documentsCount = $documentType->documents()->count();

        if ($documentsCount > 0 && empty($validated['reassign_to'])) {
            return response()->json([
                'message' => 'This document type is used by existing files. Reassign them to another type or deactivate it instead.',
                'documents_count' => $documentsCount,
            ], 422);
        }

        DB::transaction(function () use ($documentType, $validated): void {
            if (! empty($validated['reassign_to'])) {
                Document::query()
                    ->where('document_type_id', $documentType->id)
                    ->update([
                        'document_type_id' => $validated['reassign_to'],
                        'category_label' => null,
                    ]);
            }

            $documentType->delete();
        });

        return response()->json(['message' => 'Document type deleted.']);
    }

    private function ensureDocumentTypeBelongsToCompany(Request $request, DocumentType $documentType): void
    {
        if ($documentType->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
