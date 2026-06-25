<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\QuoteStatus;
use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Quote\StoreQuoteLineRequest;
use App\Http\Requests\Quote\UpdateQuoteLineRequest;
use App\Http\Resources\QuoteLineResource;
use App\Models\Quote;
use App\Models\QuoteLine;
use App\Services\DocumentLineCalculator;
use App\Services\QuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuoteLineController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly QuoteService $quoteService,
    ) {}

    public function store(StoreQuoteLineRequest $request, Quote $quote): JsonResponse
    {
        $this->ensureQuoteBelongsToCompany($request, $quote);

        if ($quote->status !== QuoteStatus::Draft) {
            return response()->json([
                'message' => 'Lines can only be added to draft quotes.',
            ], 422);
        }

        $totals = DocumentLineCalculator::lineTotals(
            (float) $request->input('quantity'),
            (float) $request->input('unit_price_ht'),
            (float) $request->input('tax_rate'),
        );

        $line = $quote->lines()->create([
            ...$request->validated(),
            ...$totals,
            'sort_order' => ($quote->lines()->max('sort_order') ?? 0) + 1,
        ]);

        $this->quoteService->recalculateTotals($quote);

        return (new QuoteLineResource($line))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateQuoteLineRequest $request, QuoteLine $quoteLine): QuoteLineResource|JsonResponse
    {
        $quoteLine->loadMissing('quote');
        $this->ensureQuoteBelongsToCompany($request, $quoteLine->quote);

        if ($quoteLine->quote->status !== QuoteStatus::Draft) {
            return response()->json([
                'message' => 'Lines can only be edited on draft quotes.',
            ], 422);
        }

        $quoteLine->fill($request->validated());

        $totals = DocumentLineCalculator::lineTotals(
            (float) $quoteLine->quantity,
            (float) $quoteLine->unit_price_ht,
            (float) $quoteLine->tax_rate,
        );

        $quoteLine->fill($totals)->save();

        $this->quoteService->recalculateTotals($quoteLine->quote);

        return new QuoteLineResource($quoteLine->fresh());
    }

    public function destroy(Request $request, QuoteLine $quoteLine): JsonResponse
    {
        $quoteLine->loadMissing('quote');
        $this->ensureQuoteBelongsToCompany($request, $quoteLine->quote);

        if ($quoteLine->quote->status !== QuoteStatus::Draft) {
            return response()->json([
                'message' => 'Lines can only be removed from draft quotes.',
            ], 422);
        }

        $quote = $quoteLine->quote;
        $quoteLine->delete();
        $this->quoteService->recalculateTotals($quote);

        return response()->json(['message' => 'Quote line deleted.']);
    }

    private function ensureQuoteBelongsToCompany(Request $request, Quote $quote): void
    {
        if ($quote->company_id !== $this->companyId($request)) {
            abort(404);
        }
    }
}
