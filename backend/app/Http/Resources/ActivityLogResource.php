<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ActivityLog */
class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $action = match ($this->action_type) {
            'created' => 'creation',
            'updated' => 'modification',
            'deleted' => 'suppression',
            default => 'modification',
        };

        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'user_id' => $this->user_id,
            'project_id' => $this->project_id,
            'action_type' => $this->action_type,
            'action' => $action,
            'actor' => $this->user?->full_name ?? 'Système',
            'project_title' => $this->project?->title,
            'project_reference' => $this->project?->reference,
            'message' => $this->description,
            'description' => $this->description,
            'timestamp' => $this->created_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
