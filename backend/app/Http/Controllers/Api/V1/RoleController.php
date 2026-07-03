<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    use ResolvesCompanyContext;

    public function index(Request $request): AnonymousResourceCollection
    {
        $companyId = $this->companyId($request);

        $roles = Role::query()
            ->with('permissions')
            ->where(function ($builder) use ($companyId): void {
                $builder->whereNull('company_id')
                    ->orWhere('company_id', $companyId);
            })
            ->orderBy('name')
            ->get();

        return RoleResource::collection($roles);
    }

    public function store(Request $request): JsonResponse
    {
        $companyId = $this->companyId($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'badge_tone' => ['nullable', 'string', 'max:20'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name'], '_');

        $role = Role::query()->create([
            'company_id' => $companyId,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'badge_tone' => $validated['badge_tone'] ?? 'slate',
            'is_system' => false,
        ]);

        if (! empty($validated['permission_ids'])) {
            $role->permissions()->sync($validated['permission_ids']);
        }

        return (new RoleResource($role->load('permissions')))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Role $role): RoleResource
    {
        $companyId = $this->companyId($request);

        if ($role->company_id !== null && $role->company_id !== $companyId) {
            abort(404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'badge_tone' => ['nullable', 'string', 'max:20'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        if ($role->is_system) {
            unset($validated['name']);
        }

        $role->update(collect($validated)->except('permission_ids')->all());

        if (array_key_exists('permission_ids', $validated)) {
            if ($role->is_system) {
                abort(422, 'Les permissions des rôles système ne peuvent pas être modifiées.');
            }

            $role->permissions()->sync($validated['permission_ids'] ?? []);
        }

        return new RoleResource($role->fresh()->load('permissions'));
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        if ($role->is_system) {
            return response()->json(['message' => 'System roles cannot be deleted.'], 422);
        }

        $companyId = $this->companyId($request);

        if ($role->company_id !== null && $role->company_id !== $companyId) {
            abort(404);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }
}
