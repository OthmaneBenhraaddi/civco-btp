<?php

namespace App\Http\Resources;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Role */
class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'company_id' => $this->company_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'badge_tone' => $this->badge_tone,
            'is_system' => $this->is_system,
            // Catalog is loaded separately — roles only need IDs for the toggle UI.
            'permission_ids' => $this->whenLoaded(
                'permissions',
                fn () => $this->permissions->pluck('id')->map(fn ($id) => (int) $id)->values()->all(),
            ),
            'permissions' => $this->when(
                $this->relationLoaded('permissions') && $request->boolean('include_permissions'),
                fn () => $this->permissions->map(fn ($permission) => [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'slug' => $permission->slug,
                    'module' => $permission->module,
                ]),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
