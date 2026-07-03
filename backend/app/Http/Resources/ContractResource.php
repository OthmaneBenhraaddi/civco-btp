<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Contract */
class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'project_id' => $this->project_id,
            'client_id' => $this->client_id,
            'contract_template_id' => $this->contract_template_id,
            'title' => $this->title,
            'content' => $this->content,
            'status' => $this->status?->value ?? $this->status,
            'client_signed_at' => $this->client_signed_at?->toIso8601String(),
            'tenant_signed_at' => $this->tenant_signed_at?->toIso8601String(),
            'has_client_signature' => $this->client_signature_data !== null,
            'has_tenant_signature' => $this->tenant_signature_data !== null,
            'generation_count' => (int) $this->generation_count,
            'project' => $this->whenLoaded('project', fn () => [
                'id' => $this->project->id,
                'title' => $this->project->title,
                'reference' => $this->project->reference,
            ]),
            'client' => $this->whenLoaded('client', fn () => [
                'id' => $this->client->id,
                'name' => $this->client->name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
