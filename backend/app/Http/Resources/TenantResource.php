<?php

namespace App\Http\Resources;

use App\Models\Tenant;
use App\Support\TenantLoginUrl;
use App\Support\TenantLogoStorage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Tenant */
class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'subdomain' => $this->subdomain,
            'custom_domain' => $this->custom_domain,
            'status' => $this->status?->value ?? $this->status,
            'logo_url' => TenantLogoStorage::url($this->logo_path),
            'login_url' => TenantLoginUrl::forSubdomain($this->subdomain),
            'workspace_url' => TenantLoginUrl::localFrontendLoginUrl($this->subdomain),
            'mail_from_address' => $this->mail_from_address,
            'mail_host' => $this->mail_host,
            'mail_port' => $this->mail_port,
            'mail_username' => $this->mail_username,
            'mail_encryption' => $this->mail_encryption,
            'mail_password_set' => filled($this->mail_password),
            'has_custom_smtp' => $this->hasCustomSmtp(),
            'users_count' => $this->whenCounted('users'),
            'admins' => TenantAdminResource::collection($this->whenLoaded('admins')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
