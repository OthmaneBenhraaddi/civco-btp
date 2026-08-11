<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Team\StoreTeamMemberRequest;
use App\Http\Requests\Team\UpdateTeamMemberRoleRequest;
use App\Http\Resources\TeamMemberResource;
use App\Http\Resources\TenantTeamOptionResource;
use App\Models\Tenant;
use App\Models\User;
use App\Services\ActivityLogService;
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
        private readonly ActivityLogService $activityLogService,
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

        if ($request->filled('search')) {
            $term = '%'.$request->string('search')->trim().'%';
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->where('email', 'like', $term)
                    ->orWhere('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", [$term]);
            });
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
                $request->integer('role_id'),
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

        $user->loadMissing(['companies', 'tenant:id,name,subdomain', 'roles:id,name,slug']);

        $this->activityLogService->logTeamMemberAccessToggled($user, $nextStatus, $actor);

        return new TeamMemberResource($user->fresh()->load(['tenant:id,name,subdomain', 'roles:id,name,slug']));
    }

    public function updateRole(UpdateTeamMemberRoleRequest $request, User $user): JsonResponse|TeamMemberResource
    {
        $actor = $request->user();

        $this->teamQueryService->assertCanChangeMemberRole($actor, $user);

        $companyId = $actor->primaryCompany()?->id;

        if ($companyId === null) {
            throw new AccessDeniedHttpException('Aucune société active pour modifier le rôle.');
        }

        $previousRoleName = $user->roles()
            ->wherePivot('company_id', $companyId)
            ->value('roles.name')
            ?? $user->job_title
            ?? '—';

        try {
            $member = $this->teamMemberService->updateRoleForCompany(
                $user,
                $companyId,
                $request->integer('role_id'),
            );
        } catch (InvalidArgumentException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $newRoleName = $member->roles->first()?->name ?? 'Membre';

        $this->activityLogService->logTeamMemberRoleChanged(
            $member,
            (string) $previousRoleName,
            (string) $newRoleName,
            $actor,
        );

        return new TeamMemberResource($member);
    }

    public function archive(Request $request, User $user): TeamMemberResource
    {
        $actor = $request->user();

        if (! $actor->isAdmin() && ! $actor->isSuperAdmin()) {
            throw new AccessDeniedHttpException('Action réservée aux administrateurs.');
        }

        $this->teamQueryService->assertCanArchiveMember($actor, $user);

        $user->update([
            'status' => UserStatus::Archived,
            'is_active' => false,
        ]);

        $user->loadMissing(['companies', 'tenant:id,name,subdomain', 'roles:id,name,slug']);

        $this->activityLogService->logTeamMemberArchived($user, $actor);

        return new TeamMemberResource($user->fresh()->load(['tenant:id,name,subdomain', 'roles:id,name,slug']));
    }
}
