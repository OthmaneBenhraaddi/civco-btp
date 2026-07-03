<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\QuoteStatus;
use App\Models\Invoice;
use App\Models\Quote;
use App\Services\DispatchNoteService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class QuoteService
{
    public function __construct(
        private readonly InvoiceReferenceService $invoiceReferenceService,
        private readonly DispatchNoteService $dispatchNoteService,
        private readonly NotificationService $notificationService,
    ) {}

    public function recalculateTotals(Quote $quote): Quote
    {
        $quote->load('lines');

        $totalHt = round((float) $quote->lines->sum('line_total_ht'), 2);
        $totalTax = round((float) $quote->lines->sum('line_total_tax'), 2);
        $totalTtc = round((float) $quote->lines->sum('line_total_ttc'), 2);

        $quote->update([
            'total_ht' => $totalHt,
            'total_tax' => $totalTax,
            'total_ttc' => $totalTtc,
        ]);

        return $quote->fresh();
    }

    public function convertToInvoice(Quote $quote, ?int $dispatchNoteId = null): Invoice
    {
        if ($quote->status !== QuoteStatus::Accepted) {
            throw new InvalidArgumentException('Only accepted quotes can be converted to an invoice.');
        }

        if ($quote->invoice()->exists()) {
            throw new InvalidArgumentException('This quote has already been converted to an invoice.');
        }

        $this->dispatchNoteService->assertInvoiceDispatchNoteIsValid(
            $dispatchNoteId,
            $quote->company_id,
            $quote->client_id,
        );

        return DB::transaction(function () use ($quote, $dispatchNoteId) {
            $quote->load('lines');

            $invoice = Invoice::query()->create([
                'company_id' => $quote->company_id,
                'tenant_id' => $quote->tenant_id,
                'client_id' => $quote->client_id,
                'project_id' => $quote->project_id,
                'quote_id' => $quote->id,
                'dispatch_note_id' => $dispatchNoteId,
                'reference' => $this->invoiceReferenceService->nextForCompany($quote->company_id),
                'status' => InvoiceStatus::Draft,
                'issued_at' => now()->toDateString(),
                'due_date' => now()->addDays(30)->toDateString(),
                'notes' => $quote->notes,
                'total_ht' => $quote->total_ht,
                'total_tax' => $quote->total_tax,
                'total_ttc' => $quote->total_ttc,
                'amount_paid' => 0,
                'balance_due' => $quote->total_ttc,
            ]);

            foreach ($quote->lines as $index => $line) {
                $invoice->lines()->create([
                    'sort_order' => $index + 1,
                    'description' => $line->description,
                    'quantity' => $line->quantity,
                    'unit_price_ht' => $line->unit_price_ht,
                    'tax_rate' => $line->tax_rate,
                    'line_total_ht' => $line->line_total_ht,
                    'line_total_tax' => $line->line_total_tax,
                    'line_total_ttc' => $line->line_total_ttc,
                ]);
            }

            $invoice = $invoice->load(['client', 'project', 'lines', 'quote']);

            if ($invoice->tenant_id !== null) {
                $this->notificationService->notifyInvoiceCreated($invoice);
            }

            return $invoice;
        });
    }
}
