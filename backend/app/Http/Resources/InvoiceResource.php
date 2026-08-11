<?php

namespace App\Http\Resources;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Invoice */
class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'status' => $this->status->value,
            'issued_at' => $this->issued_at?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'notes' => $this->notes,
            'total_ht' => (float) $this->total_ht,
            'total_tax' => (float) $this->total_tax,
            'total_ttc' => (float) $this->total_ttc,
            'amount_paid' => (float) $this->amount_paid,
            'balance_due' => (float) $this->balance_due,
            'generation_count' => (int) $this->generation_count,
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'is_official' => (bool) ($this->client->is_official ?? true),
            ]),
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'reference' => $this->project->reference,
                'title' => $this->project->title,
            ] : null),
            'quote' => $this->whenLoaded('quote', fn () => $this->quote ? [
                'id' => $this->quote->id,
                'reference' => $this->quote->reference,
            ] : null),
            'lines' => InvoiceLineResource::collection($this->whenLoaded('lines')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
