<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Task */
class ClientPortalMilestoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'status' => $this->status?->value ?? $this->status,
            'due_date' => $this->due_date?->toDateString(),
            'progress_percent' => (float) $this->progress_percent,
            'project' => [
                'id' => $this->phase?->project?->id,
                'title' => $this->phase?->project?->title,
            ],
            'phase' => [
                'id' => $this->phase?->id,
                'name' => $this->phase?->name,
            ],
        ];
    }
}
