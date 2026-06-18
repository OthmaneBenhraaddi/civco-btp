<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PaymentController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly InvoiceService $invoiceService,
    ) {}

    public function store(StorePaymentRequest $request, Invoice $invoice): JsonResponse
    {
        $this->ensureInvoiceBelongsToCompany($request, $invoice);

        if (in_array($invoice->status, [InvoiceStatus::Draft, InvoiceStatus::Cancelled, InvoiceStatus::Paid], true)) {
            return response()->json([
                'message' => 'Payments cannot be recorded on draft, cancelled, or fully paid invoices.',
            ], 422);
        }

        try {
            $payment = $this->invoiceService->recordPayment($invoice, $request->validated());
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return (new PaymentResource($payment))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, Payment $payment): JsonResponse
    {
        $payment->loadMissing('invoice');
        $this->ensureInvoiceBelongsToCompany($request, $payment->invoice);

        $invoice = $payment->invoice;
        $payment->delete();
        $this->invoiceService->refreshPaymentStatus($invoice);

        return response()->json(['message' => 'Payment deleted.']);
    }

    private function ensureInvoiceBelongsToCompany(Request $request, Invoice $invoice): void
    {
        if ($invoice->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
