<?php

namespace App\Http\Resources;

use App\Services\AdminCredentialService;
use App\Support\ProvisionedCredentialPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class TeamMemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $canViewCredentials = ProvisionedCredentialPolicy::canRevealToViewer($viewer);

        $storedPassword = $canViewCredentials
            ? app(AdminCredentialService::class)->reveal($this->resource)
            : null;

        return [
            'id' => $this->id,
            'name' => $this->full_name,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->full_name,
            'cin' => $this->cin,
            'phone' => $this->phone,
            'email' => $this->email,
            'role' => $this->resolveAccountRole(),
            'job_title' => $this->job_title,
            'status' => $this->status?->value ?? $this->status,
            'is_active' => $this->is_active,
            'tenant_id' => $this->tenant_id,
            'tenant' => $this->whenLoaded('tenant', fn () => [
                'id' => $this->tenant->id,
                'name' => $this->tenant->name,
                'subdomain' => $this->tenant->subdomain,
            ]),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values()),
            'has_stored_credentials' => filled($this->provisioned_password),
            'stored_password' => $this->when($canViewCredentials, $storedPassword),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function resolveAccountRole(): string
    {
        if ($this->client_id !== null) {
            return 'client';
        }

        if ($this->role === 'admin') {
            return 'admin';
        }

        return 'staff';
    }
}
