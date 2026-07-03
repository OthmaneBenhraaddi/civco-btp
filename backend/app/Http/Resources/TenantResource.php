<?php

namespace App\Http\Resources;

use App\Support\TenantLoginUrl;
use App\Support\TenantLogoStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Tenant */
class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'subdomain' => $this->subdomain,
            'status' => $this->status?->value ?? $this->status,
            'logo_url' => TenantLogoStorage::url($this->logo_path),
            'login_url' => TenantLoginUrl::forSubdomain($this->subdomain),
            'users_count' => $this->whenCounted('users'),
            'admins' => TenantAdminResource::collection($this->whenLoaded('admins')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
