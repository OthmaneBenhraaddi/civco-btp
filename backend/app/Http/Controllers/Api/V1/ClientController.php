<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\ResolvesCompanyContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\Client\StoreClientRequest;
use App\Http\Requests\Client\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Badge;
use App\Models\Client;
use App\Services\ActivityLogService;
use App\Services\ClientPortalProvisioningService;
use App\Services\ClientQueryService;
use App\Support\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientController extends Controller
{
    use ResolvesCompanyContext;

    public function __construct(
        private readonly ActivityLogService $activityLogService,
        private readonly ClientQueryService $clientQuery,
        private readonly ClientPortalProvisioningService $portalProvisioning,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $actor = $request->user();
        $tenantScope = $this->clientQuery->resolveTenantScope($request, $actor);

        $query = Client::query()
            ->withoutGlobalScope('tenant')
            ->with(['badges', 'portalUser'])
            ->withCount('projects')
            ->orderBy('name');

        if ($actor->isSuperAdmin()) {
            if ($tenantScope !== null) {
                $query->where('clients.tenant_id', $tenantScope);
            }
        } else {
            $query->forCompany($this->companyId($request));

            if ($tenantScope !== null) {
                $query->where('clients.tenant_id', $tenantScope);
            }
        }

        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return ClientResource::collection(
            $query->paginate($request->integer('per_page', 15))->withQueryString()
        );
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $badgeIds = $validated['badge_ids'] ?? null;
        unset($validated['badge_ids']);

        $tenantId = $request->user()->tenant_id ?? TenantManager::currentId();

        $client = Client::query()->create([
            ...$validated,
            'company_id' => $this->companyId($request),
            'tenant_id' => $tenantId,
            'country' => $request->input('country', 'FR'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        if (is_array($badgeIds)) {
            $this->syncClientBadges($request, $client, $badgeIds);
        } elseif ($request->has('badge_ids')) {
            $this->syncClientBadges($request, $client, []);
        }

        $this->activityLogService->logClientCreated($client->fresh());

        return (new ClientResource($client->load(['badges', 'portalUser'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, Client $client): ClientResource
    {
        $this->ensureClientBelongsToCompany($request, $client);

        return new ClientResource(
            $client->loadCount('projects')->load(['badges', 'contacts', 'portalUser'])
        );
    }

    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $this->ensureClientBelongsToCompany($request, $client);

        $validated = $request->validated();
        $badgeIds = $validated['badge_ids'] ?? null;
        unset($validated['badge_ids']);

        $client->update($validated);

        if (is_array($badgeIds)) {
            $this->syncClientBadges($request, $client, $badgeIds);
        } elseif ($request->has('badge_ids')) {
            $this->syncClientBadges($request, $client, []);
        }

        return new ClientResource(
            $client->fresh()->loadCount('projects')->load(['badges', 'portalUser'])
        );
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        $this->ensureClientBelongsToCompany($request, $client);

        if ($client->projects()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a client linked to projects.',
            ], 422);
        }

        $client->delete();

        return response()->json(['message' => 'Client deleted.']);
    }

    public function togglePortalStatus(Request $request, Client $client): ClientResource
    {
        $this->ensureClientBelongsToCompany($request, $client);
        $this->clientQuery->assertCanManageClient($request->user(), $client->tenant_id);

        $validated = $request->validate([
            'active' => ['required', 'boolean'],
        ]);

        $this->portalProvisioning->setPortalActive(
            $client,
            $this->company($request),
            $validated['active'],
        );

        return new ClientResource(
            $client->fresh()->loadCount('projects')->load(['badges', 'portalUser'])
        );
    }

    private function ensureClientBelongsToCompany(Request $request, Client $client): void
    {
        $actor = $request->user();
        $tenantScope = $this->clientQuery->resolveTenantScope($request, $actor);

        if ($actor->isSuperAdmin()) {
            if ($tenantScope !== null && (int) $client->tenant_id !== $tenantScope) {
                abort(404);
            }

            return;
        }

        if ($client->company_id !== $this->companyId($request)) {
            abort(404);
        }

        if ($tenantScope !== null && (int) $client->tenant_id !== $tenantScope) {
            abort(404);
        }
    }

    /**
     * @param  array<int, int>  $badgeIds
     */
    private function syncClientBadges(Request $request, Client $client, array $badgeIds): void
    {
        $companyId = $this->companyId($request);

        $validBadgeIds = Badge::query()
            ->forCompany($companyId)
            ->whereIn('id', $badgeIds)
            ->pluck('id')
            ->all();

        $client->badges()->sync($validBadgeIds);
    }
}
