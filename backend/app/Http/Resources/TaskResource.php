<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Task */
class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_phase_id' => $this->project_phase_id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status->value,
            'progress_percent' => (float) $this->progress_percent,
            'assigned_to_user_id' => $this->assigned_to_user_id,
            'assigned_to' => $this->whenLoaded('assignedTo', fn () => [
                'id' => $this->assignedTo->id,
                'full_name' => $this->assignedTo->full_name,
            ]),
            'due_date' => $this->due_date?->toDateString(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'sort_order' => $this->sort_order,
        ];
    }
}
