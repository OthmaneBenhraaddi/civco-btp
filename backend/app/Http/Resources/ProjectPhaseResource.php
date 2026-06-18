<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ProjectPhase */
class ProjectPhaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'name' => $this->name,
            'sort_order' => $this->sort_order,
            'planned_start_date' => $this->planned_start_date?->toDateString(),
            'planned_end_date' => $this->planned_end_date?->toDateString(),
            'progress_percent' => (float) $this->progress_percent,
            'tasks' => $this->whenLoaded(
                'tasks',
                fn () => TaskResource::collection($this->tasks)->resolve(),
            ),
        ];
    }
}
