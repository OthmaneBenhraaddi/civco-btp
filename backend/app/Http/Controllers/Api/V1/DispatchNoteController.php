<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Concerns\ResolvesTenantContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\DispatchNote\StoreDispatchNoteRequest;
use App\Http\Resources\DispatchNoteResource;
use App\Models\DispatchNote;
use App\Services\DispatchNoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;

class DispatchNoteController extends Controller
{
    use ResolvesCompanyContext;
    use ResolvesTenantContext;

    public function __construct(
        private readonly DispatchNoteService $dispatchNoteService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = DispatchNote::query()
            ->forCompany($this->companyId($request))
            ->with(['client'])
            ->withCount('deliveryForms')
            ->orderByDesc('created_at');

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return DispatchNoteResource::collection(
            $query->paginate($request->integer('per_page', 15))->withQueryString()
        );
    }

    public function show(Request $request, DispatchNote $dispatchNote): DispatchNoteResource
    {
        $this->ensureBelongsToCompany($request, $dispatchNote);

        return new DispatchNoteResource(
            $dispatchNote->load(['client', 'deliveryForms.client', 'deliveryForms.project'])
        );
    }

    public function store(StoreDispatchNoteRequest $request): JsonResponse
    {
        $companyId = $this->companyId($request);
        $this->assertClientBelongsToCompany($request, $request->integer('client_id'));

        try {
            $dispatchNote = $this->dispatchNoteService->bundleDeliveryForms(
                $companyId,
                $request->integer('client_id'),
                $request->input('delivery_form_ids'),
                $request->user(),
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return (new DispatchNoteResource($dispatchNote))
            ->response()
            ->setStatusCode(201);
    }

    public function execute(Request $request, DispatchNote $dispatchNote): DispatchNoteResource|JsonResponse
    {
        $this->ensureBelongsToCompany($request, $dispatchNote);

        try {
            $dispatchNote = $this->dispatchNoteService->execute($dispatchNote);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return new DispatchNoteResource(
            $dispatchNote->load(['client', 'deliveryForms'])
        );
    }

    private function ensureBelongsToCompany(Request $request, DispatchNote $dispatchNote): void
    {
        if ($dispatchNote->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
