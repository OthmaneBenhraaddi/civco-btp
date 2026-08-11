<?php

namespace App\Http\Resources;

use App\Models\Client;
use App\Services\AdminCredentialService;
use App\Support\ProvisionedCredentialPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Client */
class ClientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $portalUser = $this->relationLoaded('portalUser') ? $this->portalUser : null;
        $canViewCredentials = ProvisionedCredentialPolicy::canRevealClientPortalCredentials(
            $viewer,
            $this->tenant_id !== null ? (int) $this->tenant_id : null,
        );

        // Decrypt only on detail / mutation responses — never on list/picker indexes.
        $action = $request->route()?->getActionMethod();
        $shouldRevealCredentials = $canViewCredentials
            && $portalUser !== null
            && in_array($action, ['show', 'store', 'update', 'archive', 'togglePortalStatus'], true);

        $storedPassword = null;

        if ($shouldRevealCredentials) {
            $storedPassword = app(AdminCredentialService::class)->reveal($portalUser);
        }

        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'tenant_id' => $this->tenant_id,
            'name' => $this->name,
            'contact_name' => $this->contact_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'postal_code' => $this->postal_code,
            'city' => $this->city,
            'country' => $this->country,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'is_official' => (bool) ($this->is_official ?? true),
            'status' => $this->status?->value ?? ($this->is_active ? 'active' : 'inactive'),
            'archived_at' => $this->archived_at?->toIso8601String(),
            'client_role_slug' => $this->client_role_slug,
            'badges' => $this->whenLoaded('badges', fn () => BadgeResource::collection($this->badges)),
            'contacts' => $this->whenLoaded('contacts', fn () => ClientContactResource::collection($this->contacts)),
            'projects_count' => $this->whenCounted('projects'),
            'portal_user' => $portalUser ? [
                'id' => $portalUser->id,
                'email' => $portalUser->email,
                'is_active' => $portalUser->is_active,
                'status' => $portalUser->status?->value ?? $portalUser->status,
                'has_stored_credentials' => filled($portalUser->provisioned_password),
                'stored_password' => $this->when($shouldRevealCredentials, $storedPassword),
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
