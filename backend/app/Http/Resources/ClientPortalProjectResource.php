<?php

namespace App\Http\Resources;

use App\Enums\ContractAmendmentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Project */
class ClientPortalProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'title' => $this->title,
            'status' => $this->status?->value ?? $this->status,
            'progress_percent' => (float) $this->progress_percent,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'revised_end_date' => $this->revised_end_date,
            'budget' => $this->budget !== null ? (float) $this->budget : null,
            'revised_budget' => $this->revised_budget,
            'pending_amendments_count' => $this->pendingAmendmentsCount(),
            'site_city' => $this->site_city,
        ];
    }

    private function pendingAmendmentsCount(): int
    {
        if (array_key_exists('pending_amendments_count', $this->resource->getAttributes())) {
            return (int) $this->pending_amendments_count;
        }

        if ($this->relationLoaded('amendments')) {
            return $this->amendments
                ->where('status', ContractAmendmentStatus::PendingClient)
                ->count();
        }

        return 0;
    }
}
