<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\WorkspaceTask */
class WorkspaceTaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $avatarUrl = $this->responsable_avatar_url
            ?: 'https://api.dicebear.com/7.x/initials/svg?seed='.rawurlencode($this->responsable_name).'&backgroundColor=6366f1';

        return [
            'id' => (string) $this->id,
            'projectId' => (string) $this->project_id,
            'projectName' => $this->project_name,
            'nom' => $this->nom,
            'responsable' => [
                'name' => $this->responsable_name,
                'avatarUrl' => $avatarUrl,
            ],
            'statut' => $this->statut,
            'echeance' => $this->echeance?->toDateString(),
            'priorite' => $this->priorite,
            'budget' => (float) $this->budget,
            'fichiers' => $this->whenLoaded('files', fn () => $this->files->pluck('filename')->values()->all(), []),
            'notes' => $this->notes ?? '',
            'lastUpdatedBy' => $this->last_updated_by_name ?? '',
            'lastUpdatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
