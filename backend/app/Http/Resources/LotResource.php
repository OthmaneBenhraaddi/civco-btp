<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Lot */
class LotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'sector_id' => $this->sector_id,
            'sector' => $this->whenLoaded('sector', fn () => [
                'id' => $this->sector->id,
                'name' => $this->sector->name,
            ]),
            'sector_name' => $this->whenLoaded('sector', fn () => $this->sector->name),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
