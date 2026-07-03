<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PortalMessage */
class PortalMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'sender_id' => $this->sender_id,
            'receiver_id' => $this->receiver_id,
            'project_id' => $this->project_id,
            'message_text' => $this->message_text,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'sender' => $this->whenLoaded('sender', fn () => [
                'id' => $this->sender->id,
                'full_name' => $this->sender->full_name,
                'is_client' => $this->sender->client_id !== null,
                'job_title' => $this->sender->job_title,
            ]),
            'receiver' => $this->whenLoaded('receiver', fn () => [
                'id' => $this->receiver->id,
                'full_name' => $this->receiver->full_name,
                'is_client' => $this->receiver->client_id !== null,
                'job_title' => $this->receiver->job_title,
            ]),
            'project' => $this->whenLoaded('project', fn () => $this->project ? [
                'id' => $this->project->id,
                'reference' => $this->project->reference,
                'title' => $this->project->title,
            ] : null),
        ];
    }
}
