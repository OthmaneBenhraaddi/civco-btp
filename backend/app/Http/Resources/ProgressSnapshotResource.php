<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ProgressSnapshot */
class ProgressSnapshotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'percent' => (float) $this->percent,
            'comment' => $this->comment,
            'recorded_at' => $this->recorded_at?->toIso8601String(),
            'recorded_by' => $this->whenLoaded('recordedBy', fn () => [
                'id' => $this->recordedBy->id,
                'full_name' => $this->recordedBy->full_name,
            ]),
        ];
    }
}
