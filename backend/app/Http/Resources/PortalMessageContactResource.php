<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class PortalMessageContactResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'job_title' => $this->job_title,
            'role' => $this->role,
            'is_client' => $this->client_id !== null,
            'unread_count' => (int) ($this->unread_count ?? 0),
        ];
    }
}
