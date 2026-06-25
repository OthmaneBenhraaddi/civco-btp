<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\QuoteStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Quote\StoreQuoteRequest;
use App\Http\Requests\Quote\UpdateQuoteRequest;
use App\Http\Resources\DeliveryFormResource;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\QuoteResource;
use App\Models\Client;
use App\Models\Project;
use App\Models\Quote;
use App\Services\DeliveryFormService;
use App\Services\QuoteReferenceService;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;

class QuoteController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly QuoteReferenceService $referenceService,
        private readonly QuoteService $quoteService,
        private readonly DeliveryFormService $deliveryFormService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Quote::query()
            ->forCompany($this->companyId($request))
            ->with(['client', 'project'])
            ->orderByDesc('created_at');

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('client', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->integer('client_id'));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        return QuoteResource::collection(
            $query->paginate($request->integer('per_page', 15))->withQueryString()
        );
    }

    public function store(StoreQuoteRequest $request): JsonResponse
    {
        $companyId = $this->companyId($request);
        $this->ensureClientBelongsToCompany($request, $request->integer('client_id'));

        if ($request->filled('project_id')) {
            $this->ensureProjectBelongsToCompany($request, $request->integer('project_id'));
        }

        $quote = Quote::query()->create([
            ...$request->validated(),
            'company_id' => $companyId,
            'reference' => $this->referenceService->nextForCompany($companyId),
            'status' => QuoteStatus::Draft,
            'issued_at' => $request->input('issued_at', now()->toDateString()),
            'total_ht' => 0,
            'total_tax' => 0,
            'total_ttc' => 0,
        ]);

        return (new QuoteResource($quote->load(['client', 'project'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Quote $quote): QuoteResource
    {
        $this->ensureQuoteBelongsToCompany($request, $quote);

        return new QuoteResource($quote->load(['client', 'project', 'lines', 'invoice', 'deliveryForms']));
    }

    public function update(UpdateQuoteRequest $request, Quote $quote): QuoteResource
    {
        $this->ensureQuoteBelongsToCompany($request, $quote);

        if ($request->filled('client_id')) {
            $this->ensureClientBelongsToCompany($request, $request->integer('client_id'));
        }

        if ($request->filled('project_id')) {
            $this->ensureProjectBelongsToCompany($request, $request->integer('project_id'));
        }

        $quote->update($request->validated());

        return new QuoteResource($quote->fresh()->load(['client', 'project', 'lines', 'invoice', 'deliveryForms']));
    }

    public function destroy(Request $request, Quote $quote): JsonResponse
    {
        $this->ensureQuoteBelongsToCompany($request, $quote);

        if ($quote->status !== QuoteStatus::Draft) {
            return response()->json([
                'message' => 'Only draft quotes can be deleted.',
            ], 422);
        }

        if ($quote->invoice()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a quote linked to an invoice.',
            ], 422);
        }

        $quote->lines()->delete();
        $quote->delete();

        return response()->json(['message' => 'Quote deleted.']);
    }

    public function convertToInvoice(Request $request, Quote $quote): JsonResponse
    {
        $this->ensureQuoteBelongsToCompany($request, $quote);

        try {
            $invoice = $this->quoteService->convertToInvoice($quote);
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return (new InvoiceResource($invoice))
            ->response()
            ->setStatusCode(201);
    }

    public function convertToDeliveryForm(Request $request, Quote $quote): JsonResponse
    {
        $this->ensureQuoteBelongsToCompany($request, $quote);

        $validated = $request->validate([
            'line_ids' => ['nullable', 'array'],
            'line_ids.*' => ['integer', 'exists:quote_lines,id'],
        ]);

        try {
            $deliveryForm = $this->deliveryFormService->createFromQuote(
                $quote,
                $validated['line_ids'] ?? [],
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return (new DeliveryFormResource($deliveryForm))
            ->response()
            ->setStatusCode(201);
    }

    public function incrementPrint(Request $request, Quote $quote): QuoteResource
    {
        $this->ensureQuoteBelongsToCompany($request, $quote);

        $quote->increment('print_count');

        return new QuoteResource($quote->fresh()->load(['client', 'project', 'lines', 'invoice', 'deliveryForms']));
    }

    private function ensureQuoteBelongsToCompany(Request $request, Quote $quote): void
    {
        if ($quote->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureClientBelongsToCompany(Request $request, int $clientId): void
    {
        $exists = Client::query()
            ->forCompany($this->companyId($request))
            ->whereKey($clientId)
            ->exists();

        if (! $exists) {
            abort(404);
        }
    }

    private function ensureProjectBelongsToCompany(Request $request, int $projectId): void
    {
        $exists = Project::query()
            ->forCompany($this->companyId($request))
            ->whereKey($projectId)
            ->exists();

        if (! $exists) {
            abort(404);
        }
    }
}
