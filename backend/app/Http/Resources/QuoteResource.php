<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Quote */
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
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
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
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
