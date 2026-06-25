<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Expense */
class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'label' => $this->label,
            'category' => $this->category->value,
            'amount' => (float) $this->amount,
            'expense_date' => $this->expense_date->toDateString(),
            'notes' => $this->notes,
            'recorded_by' => $this->whenLoaded('recordedBy', fn () => [
                'id' => $this->recordedBy->id,
                'full_name' => $this->recordedBy->full_name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
