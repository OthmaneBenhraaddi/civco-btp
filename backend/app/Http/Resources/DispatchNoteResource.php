<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DispatchNote */
class DispatchNoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference_number' => $this->reference_number,
            'status' => $this->status?->value ?? $this->status,
            'executed_at' => $this->executed_at?->toIso8601String(),
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
            ]),
            'delivery_forms' => DeliveryFormResource::collection($this->whenLoaded('deliveryForms')),
            'delivery_forms_count' => $this->whenCounted('deliveryForms'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
