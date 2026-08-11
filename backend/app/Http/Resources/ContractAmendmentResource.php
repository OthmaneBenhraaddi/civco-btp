<?php

namespace App\Http\Resources;

use App\Models\ContractAmendment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ContractAmendment */
class ContractAmendmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'contract_id' => $this->contract_id,
            'title' => $this->title,
            'type' => $this->type?->value ?? $this->type,
            'status' => $this->status?->value ?? $this->status ?? 'draft',
            'amount_change' => (float) $this->amount_change,
            'duration_change_days' => (int) $this->duration_change_days,
            'description' => $this->description,
            'has_file' => $this->hasFile(),
            'original_filename' => $this->original_filename,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'validated_at' => $this->validated_at?->toIso8601String(),
            'refused_at' => $this->refused_at?->toIso8601String(),
            'created_by' => $this->whenLoaded('createdBy', fn () => $this->createdBy ? [
                'id' => $this->createdBy->id,
                'full_name' => $this->createdBy->full_name,
            ] : null),
            'contract' => $this->whenLoaded('contract', fn () => $this->contract ? [
                'id' => $this->contract->id,
                'title' => $this->contract->title,
                'status' => $this->contract->status?->value ?? $this->contract->status,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
