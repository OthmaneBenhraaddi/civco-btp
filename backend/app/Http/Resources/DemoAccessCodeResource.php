<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DemoAccessCode */
class DemoAccessCodeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'duration_hours' => $this->duration_hours,
            'expires_at' => $this->expires_at?->toIso8601String(),
            'is_used' => $this->is_used,
            'used_at' => $this->used_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'created_by' => $this->whenLoaded('createdBy', fn () => $this->createdBy ? [
                'id' => $this->createdBy->id,
                'full_name' => $this->createdBy->full_name,
                'email' => $this->createdBy->email,
            ] : null),
            'used_by' => $this->whenLoaded('usedBy', fn () => $this->usedBy ? [
                'id' => $this->usedBy->id,
                'full_name' => $this->usedBy->full_name,
                'email' => $this->usedBy->email,
            ] : null),
            'demo_tenant' => $this->whenLoaded('demoTenant', fn () => $this->demoTenant ? [
                'id' => $this->demoTenant->id,
                'name' => $this->demoTenant->name,
                'subdomain' => $this->demoTenant->subdomain,
            ] : null),
        ];
    }
}
