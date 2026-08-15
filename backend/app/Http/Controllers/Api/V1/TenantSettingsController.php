<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateTenantDocumentControlsRequest;
use App\Http\Requests\Tenant\UpdateTenantLogoRequest;
use App\Models\Tenant;
use App\Support\TenantLogoStorage;
use App\Support\TenantPrintPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class TenantSettingsController extends Controller
{
    public function showLogo(Request $request): JsonResponse
    {
        $tenant = $this->resolveActorTenant($request);

        return response()->json($this->brandingPayload($tenant));
    }

    public function updateLogo(UpdateTenantLogoRequest $request): JsonResponse
    {
        $tenant = $this->resolveActorTenant($request);

        $logoPath = TenantLogoStorage::replace(
            $request->file('logo'),
            $tenant->subdomain,
            $tenant->logo_path,
        );

        $tenant->update(['logo_path' => $logoPath]);

        return response()->json($this->brandingPayload($tenant->fresh()));
    }

    public function destroyLogo(Request $request): JsonResponse
    {
        $tenant = $this->resolveActorTenant($request);

        TenantLogoStorage::delete($tenant->logo_path);
        $tenant->update(['logo_path' => null]);

        return response()->json($this->brandingPayload($tenant->fresh()));
    }

    public function showDocumentControls(Request $request): JsonResponse
    {
        $tenant = $this->resolveActorTenant($request);

        return response()->json($this->documentControlsPayload($tenant));
    }

    public function updateDocumentControls(UpdateTenantDocumentControlsRequest $request): JsonResponse
    {
        $tenant = $this->resolveActorTenant($request);

        $tenant->update($request->validated());

        return response()->json($this->documentControlsPayload($tenant->fresh()));
    }

    private function resolveActorTenant(Request $request): Tenant
    {
        $user = $request->user();

        if ($user === null || $user->tenant_id === null) {
            throw new AccessDeniedHttpException('Réservé aux administrateurs d\'entité.');
        }

        if (! $user->isAdmin()) {
            throw new AccessDeniedHttpException('Action réservée aux administrateurs.');
        }

        return Tenant::query()->findOrFail($user->tenant_id);
    }

    /**
     * @return array<string, mixed>
     */
    private function brandingPayload(Tenant $tenant): array
    {
        return [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'logo_url' => TenantLogoStorage::url($tenant->logo_path),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function documentControlsPayload(Tenant $tenant): array
    {
        return [
            'document_controls' => TenantPrintPolicy::limitsPayload($tenant),
        ];
    }
}
