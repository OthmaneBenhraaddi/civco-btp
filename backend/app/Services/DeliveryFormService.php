<?php

namespace App\Services;

use App\Enums\DeliveryFormStatus;
use App\Enums\QuoteStatus;
use App\Models\DeliveryForm;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DeliveryFormService
{
    public function __construct(
        private readonly DeliveryFormReferenceService $referenceService,
    ) {}

    /**
     * @param  array<int, int>  $quoteLineIds
     */
    public function createFromQuote(Quote $quote, array $quoteLineIds = []): DeliveryForm
    {
        if ($quote->status !== QuoteStatus::Accepted) {
            throw new InvalidArgumentException('Only accepted quotes can generate a delivery form.');
        }

        return DB::transaction(function () use ($quote, $quoteLineIds): DeliveryForm {
            $quote->load('lines');

            $lines = $quote->lines;

            if ($quoteLineIds !== []) {
                $lines = $lines->whereIn('id', $quoteLineIds)->values();
            }

            if ($lines->isEmpty()) {
                throw new InvalidArgumentException('Select at least one quote line to deliver.');
            }

            $deliveryForm = DeliveryForm::query()->create([
                'company_id' => $quote->company_id,
                'tenant_id' => $quote->tenant_id,
                'client_id' => $quote->client_id,
                'project_id' => $quote->project_id,
                'quote_id' => $quote->id,
                'reference' => $this->referenceService->nextForCompany($quote->company_id),
                'status' => DeliveryFormStatus::Draft,
                'delivery_date' => now()->toDateString(),
                'description' => $quote->notes,
            ]);

            foreach ($lines as $index => $line) {
                $deliveryForm->lines()->create([
                    'sort_order' => $index + 1,
                    'description' => $line->description,
                    'quantity' => $line->quantity,
                    'quote_line_id' => $line->id,
                ]);
            }

            return $deliveryForm->load(['client', 'project', 'quote', 'lines']);
        });
    }
}
