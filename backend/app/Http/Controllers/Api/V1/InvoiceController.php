<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Concerns\ResolvesTenantContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\StoreInvoiceRequest;
use App\Http\Requests\Invoice\UpdateInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\DispatchNoteService;
use App\Services\InvoiceReferenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    use ResolvesCompanyContext;
    use ResolvesTenantContext;

    public function __construct(
        private readonly InvoiceReferenceService $referenceService,
        private readonly DispatchNoteService $dispatchNoteService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Invoice::query()
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

        return InvoiceResource::collection(
            $query->paginate($request->integer('per_page', 15))->withQueryString()
        );
    }

    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        $companyId = $this->companyId($request);
        $this->assertClientBelongsToCompany($request, $request->integer('client_id'));

        if ($request->filled('project_id')) {
            $this->assertProjectBelongsToCompany($request, $request->integer('project_id'));
        }

        try {
            $this->dispatchNoteService->assertInvoiceDispatchNoteIsValid(
                $request->integer('dispatch_note_id'),
                $companyId,
                $request->integer('client_id'),
            );
        } catch (\InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $invoice = Invoice::query()->create([
            ...$request->validated(),
            ...$this->tenantAttributesForCreate($request),
            'company_id' => $companyId,
            'reference' => $this->referenceService->nextForCompany($companyId),
            'status' => InvoiceStatus::Draft,
            'issued_at' => $request->input('issued_at', now()->toDateString()),
            'due_date' => $request->input('due_date', now()->addDays(30)->toDateString()),
            'total_ht' => 0,
            'total_tax' => 0,
            'total_ttc' => 0,
            'amount_paid' => 0,
            'balance_due' => 0,
        ]);

        return (new InvoiceResource($invoice->load(['client', 'project'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Invoice $invoice): InvoiceResource
    {
        $this->ensureInvoiceBelongsToCompany($request, $invoice);

        return new InvoiceResource($invoice->load(['client', 'project', 'quote', 'lines', 'payments']));
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): InvoiceResource|JsonResponse
    {
        $this->ensureInvoiceBelongsToCompany($request, $invoice);

        if ($request->filled('client_id')) {
            $this->assertClientBelongsToCompany($request, $request->integer('client_id'));
        }

        if ($request->filled('project_id')) {
            $this->assertProjectBelongsToCompany($request, $request->integer('project_id'));
        }

        if ($request->filled('status') && in_array($invoice->status, [InvoiceStatus::Paid, InvoiceStatus::Cancelled], true)) {
            return response()->json([
                'message' => 'Paid or cancelled invoices cannot be modified.',
            ], 422);
        }

        $invoice->update($request->validated());

        return new InvoiceResource($invoice->fresh()->load(['client', 'project', 'quote', 'lines', 'payments']));
    }

    public function destroy(Request $request, Invoice $invoice): JsonResponse
    {
        $this->ensureInvoiceBelongsToCompany($request, $invoice);

        if ($invoice->status !== InvoiceStatus::Draft) {
            return response()->json([
                'message' => 'Only draft invoices can be deleted.',
            ], 422);
        }

        if ($invoice->payments()->exists()) {
            return response()->json([
                'message' => 'Cannot delete an invoice with payments.',
            ], 422);
        }

        $invoice->lines()->delete();
        $invoice->delete();

        return response()->json(['message' => 'Invoice deleted.']);
    }

    public function incrementPrint(Request $request, Invoice $invoice): InvoiceResource
    {
        $this->ensureInvoiceBelongsToCompany($request, $invoice);

        $invoice->increment('generation_count');

        return new InvoiceResource($invoice->fresh()->load(['client', 'project', 'quote', 'lines', 'payments']));
    }

    private function ensureInvoiceBelongsToCompany(Request $request, Invoice $invoice): void
    {
        if ($invoice->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
