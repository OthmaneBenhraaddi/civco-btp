<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\TenantStatus;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\StoreTenantAdminRequest;
use App\Http\Requests\SuperAdmin\StoreTenantRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantAdminStatusRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantRequest;
use App\Http\Requests\SuperAdmin\UpdateTenantStatusRequest;
use App\Http\Resources\TenantAdminResource;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Models\User;
use App\Services\AdminCredentialService;
use App\Services\TenantProvisioningService;
use App\Support\TenantLoginUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SuperAdminController extends Controller
{
    public function __construct(
        private readonly TenantProvisioningService $tenantProvisioningService,
        private readonly AdminCredentialService $adminCredentialService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Tenant::query()
            ->with([
                'admins' => fn ($builder) => $builder
                    ->orderBy('last_name')
                    ->orderBy('first_name'),
            ])
            ->withCount('users')
            ->orderBy('name');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return TenantResource::collection($query->get());
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'active_tenants' => Tenant::query()->where('status', TenantStatus::Active)->count(),
            'total_users' => User::query()
                ->whereNotNull('tenant_id')
                ->whereNull('client_id')
                ->count(),
            'system_status' => 'operational',
        ]);
    }

    public function store(StoreTenantRequest $request): JsonResponse
    {
        $result = $this->tenantProvisioningService->provision(
            $request->string('name')->toString(),
            strtolower($request->string('subdomain')->toString()),
            TenantStatus::from($request->string('status')->toString()),
            $request->file('logo'),
            $request->brandingPayload(),
        );

        $result['tenant']->load(['admins']);

        return response()->json([
            'tenant' => new TenantResource($result['tenant']),
            'admin' => [
                'id' => $result['admin']->id,
                'email' => $result['admin']->email,
                'full_name' => $result['admin']->full_name,
            ],
            'company' => [
                'id' => $result['company']->id,
                'name' => $result['company']->name,
            ],
            'temporary_password' => $result['temporary_password'],
            'login_url' => TenantLoginUrl::forSubdomain($result['tenant']->subdomain),
        ], 201);
    }

    public function storeAdmin(StoreTenantAdminRequest $request, Tenant $tenant): JsonResponse
    {
        try {
            $result = $this->tenantProvisioningService->addAdmin(
                $tenant,
                $request->string('first_name')->toString(),
                $request->string('last_name')->toString(),
                $request->string('email')->toString(),
            );
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'tenant' => new TenantResource($result['tenant']->load(['admins'])->loadCount('users')),
            'admin' => new TenantAdminResource($result['admin']),
            'temporary_password' => $result['temporary_password'],
            'login_url' => TenantLoginUrl::forSubdomain($tenant->subdomain),
        ], 201);
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant): TenantResource
    {
        $tenant->update([
            'name' => $request->string('name')->toString(),
            'subdomain' => strtolower($request->string('subdomain')->toString()),
            'status' => TenantStatus::from($request->string('status')->toString()),
            ...$request->brandingPayload(),
        ]);

        $tenant->load(['admins'])->loadCount('users');

        return new TenantResource($tenant);
    }

    public function updateStatus(UpdateTenantStatusRequest $request, Tenant $tenant): TenantResource
    {
        $status = TenantStatus::from($request->string('status')->toString());

        $tenant->update(['status' => $status]);

        $tenant->load(['admins'])->loadCount('users');

        return new TenantResource($tenant);
    }

    public function updateAdminStatus(
        UpdateTenantAdminStatusRequest $request,
        Tenant $tenant,
        User $user,
    ): TenantAdminResource {
        $this->ensureTenantAdmin($tenant, $user);

        $status = UserStatus::from($request->string('status')->toString());

        $user->update([
            'status' => $status,
            'is_active' => $status === UserStatus::Active,
        ]);

        return new TenantAdminResource($user->fresh());
    }

    public function showAdminCredentials(Tenant $tenant, User $user): JsonResponse
    {
        $this->ensureTenantAdmin($tenant, $user);

        $password = $this->adminCredentialService->reveal($user);

        return response()->json([
            'email' => $user->email,
            'password' => $password,
            'has_stored_credentials' => $password !== null,
        ]);
    }

    public function resetAdminPassword(Tenant $tenant, User $user): JsonResponse
    {
        $this->ensureTenantAdmin($tenant, $user);

        $password = $this->adminCredentialService->resetAndStore($user);

        return response()->json([
            'email' => $user->email,
            'password' => $password,
            'has_stored_credentials' => true,
        ]);
    }

    private function ensureTenantAdmin(Tenant $tenant, User $user): void
    {
        if ($user->tenant_id !== $tenant->id || $user->role !== 'admin') {
            throw new NotFoundHttpException('Administrateur introuvable pour cette entité.');
        }
    }
}
