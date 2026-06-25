<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Models\Invoice;
use App\Models\Payment;
use InvalidArgumentException;

class InvoiceService
{
    public function recalculateTotals(Invoice $invoice): Invoice
    {
        $invoice->load('lines');

        $totalHt = round((float) $invoice->lines->sum('line_total_ht'), 2);
        $totalTax = round((float) $invoice->lines->sum('line_total_tax'), 2);
        $totalTtc = round((float) $invoice->lines->sum('line_total_ttc'), 2);

        $invoice->update([
            'total_ht' => $totalHt,
            'total_tax' => $totalTax,
            'total_ttc' => $totalTtc,
            'balance_due' => round($totalTtc - (float) $invoice->amount_paid, 2),
        ]);

        return $this->refreshPaymentStatus($invoice->fresh());
    }

    public function refreshPaymentStatus(Invoice $invoice): Invoice
    {
        $amountPaid = round((float) $invoice->payments()->sum('amount'), 2);
        $balanceDue = round((float) $invoice->total_ttc - $amountPaid, 2);

        $status = $invoice->status;

        if (in_array($status, [InvoiceStatus::Cancelled, InvoiceStatus::Draft], true)) {
            $invoice->update([
                'amount_paid' => $amountPaid,
                'balance_due' => $balanceDue,
            ]);

            return $invoice->fresh();
        }

        if ($balanceDue <= 0 && $amountPaid > 0) {
            $status = InvoiceStatus::Paid;
        } elseif ($amountPaid > 0) {
            $status = InvoiceStatus::PartiallyPaid;
        } elseif ($invoice->due_date !== null && $invoice->due_date->isPast()) {
            $status = InvoiceStatus::Overdue;
        } elseif ($status === InvoiceStatus::Draft) {
            $status = InvoiceStatus::Draft;
        } else {
            $status = InvoiceStatus::Sent;
        }

        $invoice->update([
            'amount_paid' => $amountPaid,
            'balance_due' => max($balanceDue, 0),
            'status' => $status,
        ]);

        return $invoice->fresh();
    }

    public function recordPayment(Invoice $invoice, array $data): Payment
    {
        $amount = (float) $data['amount'];
        $currentBalance = round((float) $invoice->total_ttc - (float) $invoice->amount_paid, 2);

        if ($amount <= 0) {
            throw new InvalidArgumentException('Payment amount must be greater than zero.');
        }

        if ($amount > $currentBalance) {
            throw new InvalidArgumentException('Payment amount exceeds the invoice balance.');
        }

        $payment = $invoice->payments()->create([
            'amount' => $amount,
            'paid_at' => $data['paid_at'],
            'method' => $data['method'] ?? PaymentMethod::BankTransfer->value,
            'reference' => $data['reference'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        $this->refreshPaymentStatus($invoice->fresh());

        return $payment;
    }
}
