<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\InvoiceLine */
class InvoiceLineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'sort_order' => $this->sort_order,
            'description' => $this->description,
            'quantity' => (float) $this->quantity,
            'unit_price_ht' => (float) $this->unit_price_ht,
            'tax_rate' => (float) $this->tax_rate,
            'line_total_ht' => (float) $this->line_total_ht,
            'line_total_tax' => (float) $this->line_total_tax,
            'line_total_ttc' => (float) $this->line_total_ttc,
        ];
    }
}
