<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Client;
use App\Models\Project;
use App\Support\TenantManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

trait ResolvesTenantContext
{
    protected function actorTenantId(Request $request): ?int
    {
        $user = $request->user();

        if ($user?->tenant_id !== null) {
            return (int) $user->tenant_id;
        }

        $attributeTenantId = $request->attributes->get('tenant_id');

        if ($attributeTenantId !== null) {
            return (int) $attributeTenantId;
        }

        return TenantManager::currentId();
    }

    /**
     * @return array{tenant_id: int}|array{}
     */
    protected function tenantAttributesForCreate(Request $request): array
    {
        $tenantId = $this->actorTenantId($request);

        return $tenantId !== null ? ['tenant_id' => $tenantId] : [];
    }

    protected function applyActorTenantScope(Builder $query, Request $request, ?string $table = null): Builder
    {
        $table ??= $query->getModel()->getTable();
        $tenantId = $this->actorTenantId($request);

        $query->withoutGlobalScope('tenant');

        if ($tenantId !== null) {
            $query->where("{$table}.tenant_id", $tenantId);
        }

        return $query;
    }

    protected function assertClientBelongsToCompany(Request $request, int $clientId): void
    {
        $exists = $this->applyActorTenantScope(Client::query(), $request)
            ->forCompany($this->companyId($request))
            ->whereKey($clientId)
            ->exists();

        if (! $exists) {
            abort(404);
        }
    }

    protected function assertProjectBelongsToCompany(Request $request, int $projectId): void
    {
        $exists = $this->applyActorTenantScope(Project::query(), $request)
            ->forCompany($this->companyId($request))
            ->whereKey($projectId)
            ->exists();

        if (! $exists) {
            abort(404);
        }
    }
}
