<?php

namespace App\Http\Resources;

use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Quote */
class QuoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'status' => $this->status->value,
            'issued_at' => $this->issued_at?->toDateString(),
            'valid_until' => $this->valid_until?->toDateString(),
            'notes' => $this->notes,
            'total_ht' => (float) $this->total_ht,
            'total_tax' => (float) $this->total_tax,
            'total_ttc' => (float) $this->total_ttc,
            'generation_count' => (int) $this->generation_count,
            'has_client_signature' => $this->client_signature_data !== null,
            'client_signed_at' => $this->client_signed_at?->toIso8601String(),
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
            'lines' => QuoteLineResource::collection($this->whenLoaded('lines')),
            'invoice' => $this->whenLoaded('invoice', fn () => $this->invoice ? [
                'id' => $this->invoice->id,
                'reference' => $this->invoice->reference,
            ] : null),
            'delivery_forms' => $this->whenLoaded('deliveryForms', fn () => $this->deliveryForms->map(fn ($form) => [
                'id' => $form->id,
                'reference' => $form->reference,
                'status' => $form->status->value,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
