<?php

namespace App\Http\Resources;

use App\Enums\QuoteStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Quote */
class ClientPortalQuoteResource extends JsonResource
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
            'has_client_signature' => $this->client_signature_data !== null,
            'client_signed_at' => $this->client_signed_at?->toIso8601String(),
            'can_accept' => $this->status === QuoteStatus::Sent && $this->client_signature_data === null,
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'reference' => $this->project->reference,
                'title' => $this->project->title,
            ] : null),
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'name' => $this->client->name,
            ] : null),
            'lines' => QuoteLineResource::collection($this->whenLoaded('lines')),
        ];
    }
}
