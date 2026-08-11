<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Project */
class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'client_id' => $this->client_id,
            'reference' => $this->reference,
            'title' => $this->title,
            'description' => $this->description,
            'description_meta' => $this->description_meta,
            'status' => $this->status->value,
            'nature' => $this->nature,
            'sector' => $this->sector,
            'etat_paiement' => $this->etat_paiement,
            'delais' => $this->delais,
            'avancement' => $this->avancement,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'actual_start_date' => $this->actual_start_date?->toDateString(),
            'actual_end_date' => $this->actual_end_date?->toDateString(),
            'budget' => $this->budget !== null ? (float) $this->budget : null,
            'total_budget' => $this->total_budget,
            'revised_budget' => $this->revised_budget,
            'adjusted_end_date' => $this->adjusted_end_date,
            'revised_end_date' => $this->revised_end_date,
            'amendments_amount_delta' => $this->amendments_amount_delta,
            'amendments_duration_delta' => $this->amendments_duration_delta,
            'progress_percent' => (float) $this->progress_percent,
            'site_address_line1' => $this->site_address_line1,
            'site_city' => $this->site_city,
            'site_postal_code' => $this->site_postal_code,
            'site_address' => $this->site_address ?? $this->formattedSiteAddress(),
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'client' => new ClientResource($this->whenLoaded('client')),
            'lots' => $this->whenLoaded('lots', fn () => LotResource::collection($this->lots)),
            'phases' => $this->whenLoaded(
                'phases',
                fn () => ProjectPhaseResource::collection($this->phases)->resolve(),
            ),
            'team_members' => $this->whenLoaded('teamMembers', fn () => $this->teamMembers->map(fn ($user) => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role_label' => $user->pivot->role_label,
                'assigned_at' => $user->pivot->assigned_at,
                'can_chat_with_client' => (bool) ($user->pivot->can_chat_with_client ?? false),
            ])),
            'progress_snapshots' => $this->whenLoaded(
                'progressSnapshots',
                fn () => ProgressSnapshotResource::collection($this->progressSnapshots)->resolve(),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
