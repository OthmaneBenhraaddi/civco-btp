<?php

namespace Database\Seeders\Concerns;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Enums\ProjectStatus;
use App\Enums\QuoteStatus;
use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Payment;
use App\Models\Quote;
use App\Models\QuoteLine;
use Illuminate\Support\Carbon;

trait SeedsFinancialDocuments
{
    private const TAX_RATE = 20.0;

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $lines
     */
    protected function seedQuote(
        int $tenantId,
        int $companyId,
        int $clientId,
        int $projectId,
        string $reference,
        QuoteStatus $status,
        Carbon $issuedAt,
        Carbon $validUntil,
        string $notes,
        array $lines,
    ): Quote {
        $quote = Quote::query()->create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'client_id' => $clientId,
            'project_id' => $projectId,
            'reference' => $reference,
            'status' => $status,
            'issued_at' => $issuedAt->toDateString(),
            'valid_until' => $validUntil->toDateString(),
            'notes' => $notes,
            'total_ht' => 0,
            'total_tax' => 0,
            'total_ttc' => 0,
        ]);

        $quote->update($this->createQuoteLines($quote, $lines));

        return $quote->fresh();
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $lines
     * @param  array<int, array{amount: float, paid_at: Carbon, method: PaymentMethod, reference: string, notes: string}>  $payments
     */
    protected function seedInvoice(
        int $tenantId,
        int $companyId,
        int $clientId,
        int $projectId,
        ?int $quoteId,
        string $reference,
        InvoiceStatus $status,
        Carbon $issuedAt,
        Carbon $dueDate,
        string $notes,
        array $lines,
        float $amountPaid,
        array $payments,
    ): Invoice {
        $invoice = Invoice::query()->create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'client_id' => $clientId,
            'project_id' => $projectId,
            'quote_id' => $quoteId,
            'reference' => $reference,
            'status' => $status,
            'issued_at' => $issuedAt->toDateString(),
            'due_date' => $dueDate->toDateString(),
            'notes' => $notes,
            'total_ht' => 0,
            'total_tax' => 0,
            'total_ttc' => 0,
            'amount_paid' => 0,
            'balance_due' => 0,
        ]);

        $totals = $this->createInvoiceLines($invoice, $lines);
        $balanceDue = max(round($totals['total_ttc'] - $amountPaid, 2), 0);

        $invoice->update([
            ...$totals,
            'amount_paid' => $amountPaid,
            'balance_due' => $balanceDue,
            'status' => $status,
        ]);

        foreach ($payments as $payment) {
            Payment::query()->create([
                'invoice_id' => $invoice->id,
                'amount' => $payment['amount'],
                'paid_at' => $payment['paid_at']->toDateString(),
                'method' => $payment['method'],
                'reference' => $payment['reference'],
                'notes' => $payment['notes'],
            ]);
        }

        return $invoice->fresh();
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $lines
     * @return array{total_ht: float, total_tax: float, total_ttc: float}
     */
    protected function createQuoteLines(Quote $quote, array $lines): array
    {
        $totalHt = 0.0;
        $totalTax = 0.0;
        $totalTtc = 0.0;

        foreach ($lines as $index => $line) {
            $lineTotals = $this->calculateLineTotals($line['quantity'], $line['unit_price_ht']);

            QuoteLine::query()->create([
                'quote_id' => $quote->id,
                'sort_order' => $index,
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price_ht' => $line['unit_price_ht'],
                'tax_rate' => self::TAX_RATE,
                ...$lineTotals,
            ]);

            $totalHt += $lineTotals['line_total_ht'];
            $totalTax += $lineTotals['line_total_tax'];
            $totalTtc += $lineTotals['line_total_ttc'];
        }

        return [
            'total_ht' => round($totalHt, 2),
            'total_tax' => round($totalTax, 2),
            'total_ttc' => round($totalTtc, 2),
        ];
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $lines
     * @return array{total_ht: float, total_tax: float, total_ttc: float}
     */
    protected function createInvoiceLines(Invoice $invoice, array $lines): array
    {
        $totalHt = 0.0;
        $totalTax = 0.0;
        $totalTtc = 0.0;

        foreach ($lines as $index => $line) {
            $lineTotals = $this->calculateLineTotals($line['quantity'], $line['unit_price_ht']);

            InvoiceLine::query()->create([
                'invoice_id' => $invoice->id,
                'sort_order' => $index,
                'description' => $line['description'],
                'quantity' => $line['quantity'],
                'unit_price_ht' => $line['unit_price_ht'],
                'tax_rate' => self::TAX_RATE,
                ...$lineTotals,
            ]);

            $totalHt += $lineTotals['line_total_ht'];
            $totalTax += $lineTotals['line_total_tax'];
            $totalTtc += $lineTotals['line_total_ttc'];
        }

        return [
            'total_ht' => round($totalHt, 2),
            'total_tax' => round($totalTax, 2),
            'total_ttc' => round($totalTtc, 2),
        ];
    }

    /**
     * @return array{line_total_ht: float, line_total_tax: float, line_total_ttc: float}
     */
    protected function calculateLineTotals(float|int $quantity, float $unitPriceHt): array
    {
        $lineTotalHt = round((float) $quantity * $unitPriceHt, 2);
        $lineTotalTax = round($lineTotalHt * (self::TAX_RATE / 100), 2);
        $lineTotalTtc = round($lineTotalHt + $lineTotalTax, 2);

        return [
            'line_total_ht' => $lineTotalHt,
            'line_total_tax' => $lineTotalTax,
            'line_total_ttc' => $lineTotalTtc,
        ];
    }

    /**
     * @param  array<int, array{description: string, quantity: float|int, unit_price_ht: float}>  $quoteLines
     */
    protected function seedFinancialsForActiveProject(
        int $tenantId,
        int $companyId,
        int $clientId,
        int $projectId,
        string $refPrefix,
        int $sequence,
        ProjectStatus $projectStatus,
        array $quoteLines,
        string $quoteNotes,
    ): ?array {
        if (! in_array($projectStatus, [ProjectStatus::InProgress, ProjectStatus::Completed], true)) {
            return null;
        }

        $quoteRef = sprintf('%s-DEV-%03d', $refPrefix, $sequence);
        $quoteStatus = QuoteStatus::Accepted;

        $quote = $this->seedQuote(
            $tenantId,
            $companyId,
            $clientId,
            $projectId,
            $quoteRef,
            $quoteStatus,
            now()->subMonths(4),
            now()->addMonths(2),
            $quoteNotes,
            $quoteLines,
        );

        $invoiceLineTotal = round(
            array_sum(array_map(
                fn (array $line) => (float) $line['quantity'] * (float) $line['unit_price_ht'],
                $quoteLines,
            )) * 0.35,
            2,
        );

        if ($invoiceLineTotal <= 0) {
            $invoiceLineTotal = 75_000;
        }

        $invoiceRef = sprintf('%s-FAC-%03d', $refPrefix, $sequence);
        $isCompleted = $projectStatus === ProjectStatus::Completed;

        $invoice = $this->seedInvoice(
            $tenantId,
            $companyId,
            $clientId,
            $projectId,
            $quote->id,
            $invoiceRef,
            $isCompleted ? InvoiceStatus::Paid : InvoiceStatus::PartiallyPaid,
            now()->subMonths(2),
            now()->addDays(30),
            $isCompleted ? 'Solde final — chantier terminé.' : 'Situation intermédiaire — travaux en cours.',
            [['description' => 'Tranche facturée — '.$quoteNotes, 'quantity' => 1, 'unit_price_ht' => $invoiceLineTotal]],
            $isCompleted ? round($invoiceLineTotal * 1.2, 2) : round($invoiceLineTotal * 1.2 * 0.6, 2),
            $isCompleted
                ? [[
                    'amount' => round($invoiceLineTotal * 1.2, 2),
                    'paid_at' => now()->subMonth(),
                    'method' => PaymentMethod::BankTransfer,
                    'reference' => $refPrefix.'-VIR-'.$sequence,
                    'notes' => 'Règlement final',
                ]]
                : [[
                    'amount' => round($invoiceLineTotal * 1.2 * 0.6, 2),
                    'paid_at' => now()->subWeeks(3),
                    'method' => PaymentMethod::BankTransfer,
                    'reference' => $refPrefix.'-VIR-'.$sequence,
                    'notes' => 'Acompte situation',
                ]],
        );

        return ['quote' => $quote, 'invoice' => $invoice];
    }
}
