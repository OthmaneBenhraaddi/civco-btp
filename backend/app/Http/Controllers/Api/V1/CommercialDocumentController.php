<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Models\DeliveryForm;
use App\Models\Invoice;
use App\Models\Quote;
use App\Services\DocumentTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommercialDocumentController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly DocumentTemplateService $documentTemplateService,
    ) {}

    public function quotePreview(Request $request, Quote $quote): JsonResponse
    {
        $this->ensureQuoteBelongsToCompany($request, $quote);

        $template = $request->string('template')->trim()->toString() ?: null;

        return response()->json(
            $this->documentTemplateService->buildQuotePreview($quote, $template)
        );
    }

    public function invoicePreview(Request $request, Invoice $invoice): JsonResponse
    {
        $this->ensureInvoiceBelongsToCompany($request, $invoice);

        $template = $request->string('template')->trim()->toString() ?: null;

        return response()->json(
            $this->documentTemplateService->buildInvoicePreview($invoice, $template)
        );
    }

    public function deliveryFormPreview(Request $request, DeliveryForm $deliveryForm): JsonResponse
    {
        $this->ensureDeliveryFormBelongsToCompany($request, $deliveryForm);

        $template = $request->string('template')->trim()->toString() ?: null;

        return response()->json(
            $this->documentTemplateService->buildDeliveryFormPreview($deliveryForm, $template)
        );
    }

    private function ensureQuoteBelongsToCompany(Request $request, Quote $quote): void
    {
        if ($quote->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureInvoiceBelongsToCompany(Request $request, Invoice $invoice): void
    {
        if ($invoice->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }

    private function ensureDeliveryFormBelongsToCompany(Request $request, DeliveryForm $deliveryForm): void
    {
        if ($deliveryForm->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
