<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Team\StoreTeamMemberRequest;
use App\Http\Resources\TeamMemberResource;
use App\Http\Resources\TenantTeamOptionResource;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TeamMemberService;
use App\Services\TeamQueryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class TeamController extends Controller
{
    public function __construct(
        private readonly TeamMemberService $teamMemberService,
        private readonly TeamQueryService $teamQueryService,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $actor = $request->user();

        if (! $actor->isAdmin() && ! $actor->isSuperAdmin()) {
            throw new AccessDeniedHttpException('Action réservée aux administrateurs.');
        }

        $tenantId = $this->teamQueryService->resolveTenantScope($request, $actor);

        $query = User::query()
            ->whereNull('client_id')
            ->whereNotNull('tenant_id')
            ->with([
                'tenant:id,name,subdomain',
                'roles:id,name,slug',
            ])
            ->orderBy('last_name')
            ->orderBy('first_name');

        // No status filter: include active, inactive, and archived members.

        if ($tenantId !== null) {
            $query->where('tenant_id', $tenantId);
        }

        if (! $actor->isSuperAdmin()) {
            $companyId = $actor->primaryCompany()?->id;

            if ($companyId !== null) {
                $query->whereHas(
                    'companies',
                    fn ($builder) => $builder->where('companies.id', $companyId),
                );
            }
        }

        return TeamMemberResource::collection($query->get());
    }

    /**
     * All tenants for the super-admin team filter dropdown (no user/status filtering).
     */
    public function tenantOptions(Request $request): AnonymousResourceCollection
    {
        $actor = $request->user();

        if (! $actor->isSuperAdmin()) {
            throw new AccessDeniedHttpException('Action réservée au super administrateur.');
        }

        return TenantTeamOptionResource::collection(
            Tenant::query()
                ->orderBy('name')
                ->get(['id', 'name', 'subdomain', 'status']),
        );
    }

    public function store(StoreTeamMemberRequest $request): JsonResponse
    {
        $actor = $request->user();
        $tenantId = $actor->tenant_id;

        if ($tenantId === null) {
            throw new AccessDeniedHttpException('Seuls les administrateurs d\'entité peuvent ajouter des membres d\'équipe.');
        }

        $companyId = $actor->primaryCompany()?->id;

        if ($companyId === null) {
            throw new AccessDeniedHttpException('Aucune société active pour créer un membre.');
        }

        try {
            $member = $this->teamMemberService->createForCompany(
                $companyId,
                $tenantId,
                $request->string('first_name')->toString(),
                $request->string('last_name')->toString(),
                $request->string('email')->toString(),
                $request->string('password')->toString(),
                $request->string('role')->toString(),
                $request->input('cin'),
                $request->input('phone'),
                $request->input('job_title'),
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return (new TeamMemberResource($member))
            ->response()
            ->setStatusCode(201);
    }

    public function toggleStatus(Request $request, User $user): TeamMemberResource
    {
        $actor = $request->user();

        if (! $actor->isAdmin() && ! $actor->isSuperAdmin()) {
            throw new AccessDeniedHttpException('Action réservée aux administrateurs.');
        }

        $this->teamQueryService->assertCanToggleMemberStatus($actor, $user);

        $nextStatus = ($user->status ?? UserStatus::Active) === UserStatus::Active
            ? UserStatus::Inactive
            : UserStatus::Active;

        $user->update([
            'status' => $nextStatus,
            'is_active' => $nextStatus === UserStatus::Active,
        ]);

        return new TeamMemberResource($user->fresh()->load(['tenant:id,name,subdomain', 'roles:id,name,slug']));
    }
}
