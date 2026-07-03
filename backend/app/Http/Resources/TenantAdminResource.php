<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class TenantAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'status' => $this->status?->value ?? $this->status,
            'role' => $this->role,
            'is_active' => $this->is_active,
            'has_stored_credentials' => filled($this->provisioned_password),
        ];
    }
}
