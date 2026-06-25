<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DeliveryFormLine */
class DeliveryFormLineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sort_order' => $this->sort_order,
            'description' => $this->description,
            'quantity' => (float) $this->quantity,
            'quote_line_id' => $this->quote_line_id,
            'project_phase_id' => $this->project_phase_id,
            'project_phase' => $this->whenLoaded('projectPhase', fn () => $this->projectPhase ? [
                'id' => $this->projectPhase->id,
                'name' => $this->projectPhase->name,
            ] : null),
        ];
    }
}
