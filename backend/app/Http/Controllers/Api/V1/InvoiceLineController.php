<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\StoreInvoiceLineRequest;
use App\Http\Requests\Invoice\UpdateInvoiceLineRequest;
use App\Http\Resources\InvoiceLineResource;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Services\DocumentLineCalculator;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceLineController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly InvoiceService $invoiceService,
    ) {}

    public function store(StoreInvoiceLineRequest $request, Invoice $invoice): JsonResponse
    {
        $this->ensureInvoiceBelongsToCompany($request, $invoice);

        if ($invoice->status !== InvoiceStatus::Draft) {
            return response()->json([
                'message' => 'Lines can only be added to draft invoices.',
            ], 422);
        }

        $totals = DocumentLineCalculator::lineTotals(
            (float) $request->input('quantity'),
            (float) $request->input('unit_price_ht'),
            (float) $request->input('tax_rate'),
        );

        $line = $invoice->lines()->create([
            ...$request->validated(),
            ...$totals,
            'sort_order' => ($invoice->lines()->max('sort_order') ?? 0) + 1,
        ]);

        $this->invoiceService->recalculateTotals($invoice);

        return (new InvoiceLineResource($line))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateInvoiceLineRequest $request, InvoiceLine $invoiceLine): InvoiceLineResource|JsonResponse
    {
        $invoiceLine->loadMissing('invoice');
        $this->ensureInvoiceBelongsToCompany($request, $invoiceLine->invoice);

        if ($invoiceLine->invoice->status !== InvoiceStatus::Draft) {
            return response()->json([
                'message' => 'Lines can only be edited on draft invoices.',
            ], 422);
        }

        $invoiceLine->fill($request->validated());

        $totals = DocumentLineCalculator::lineTotals(
            (float) $invoiceLine->quantity,
            (float) $invoiceLine->unit_price_ht,
            (float) $invoiceLine->tax_rate,
        );

        $invoiceLine->fill($totals)->save();

        $this->invoiceService->recalculateTotals($invoiceLine->invoice);

        return new InvoiceLineResource($invoiceLine->fresh());
    }

    public function destroy(Request $request, InvoiceLine $invoiceLine): JsonResponse
    {
        $invoiceLine->loadMissing('invoice');
        $this->ensureInvoiceBelongsToCompany($request, $invoiceLine->invoice);

        if ($invoiceLine->invoice->status !== InvoiceStatus::Draft) {
            return response()->json([
                'message' => 'Lines can only be removed from draft invoices.',
            ], 422);
        }

        $invoice = $invoiceLine->invoice;
        $invoiceLine->delete();
        $this->invoiceService->recalculateTotals($invoice);

        return response()->json(['message' => 'Invoice line deleted.']);
    }

    private function ensureInvoiceBelongsToCompany(Request $request, Invoice $invoice): void
    {
        if ($invoice->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
