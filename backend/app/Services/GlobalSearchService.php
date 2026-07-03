<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Project;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\User;
use App\Support\TenantManager;
use Illuminate\Support\Collection;

class GlobalSearchService
{
    private const LIMIT_PER_TYPE = 5;

    /**
     * @return array{
     *   tenants: list<array<string, mixed>>,
     *   clients: list<array<string, mixed>>,
     *   projects: list<array<string, mixed>>,
     *   tasks: list<array<string, mixed>>
     * }
     */
    public function search(User $user, int $companyId, string $query, ?int $tenantId = null): array
    {
        $term = trim($query);

        if (mb_strlen($term) < 2) {
            return $this->emptyResult();
        }

        $like = '%'.$term.'%';
        $isSuperAdmin = $user->isSuperAdmin();
        $scopedTenantId = $this->resolveTenantScope($user, $tenantId);

        $tenants = $isSuperAdmin
            ? $this->searchTenants($like)
            : [];

        $clients = $this->searchClients($companyId, $like, $scopedTenantId);
        $projects = $this->searchProjects($companyId, $like, $scopedTenantId);
        $tasks = $this->searchTasks($companyId, $like, $scopedTenantId);

        return [
            'tenants' => $tenants,
            'clients' => $clients,
            'projects' => $projects,
            'tasks' => $tasks,
        ];
    }

    private function resolveTenantScope(User $user, ?int $tenantId): ?int
    {
        if ($user->isSuperAdmin()) {
            return $tenantId;
        }

        return $user->tenant_id !== null ? (int) $user->tenant_id : null;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchTenants(string $like): array
    {
        return Tenant::query()
            ->where(function ($builder) use ($like): void {
                $builder->where('name', 'like', $like)
                    ->orWhere('subdomain', 'like', $like);
            })
            ->orderBy('name')
            ->limit(self::LIMIT_PER_TYPE)
            ->get(['id', 'name', 'subdomain', 'status'])
            ->map(fn (Tenant $tenant) => [
                'id' => $tenant->id,
                'type' => 'tenant',
                'label' => $tenant->name,
                'subtitle' => $tenant->subdomain,
                'path' => '/super-admin',
                'tenant_subdomain' => $tenant->subdomain,
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchClients(int $companyId, string $like, ?int $tenantId): array
    {
        $query = Client::query()
            ->forCompany($companyId)
            ->where(function ($builder) use ($like): void {
                $builder->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('contact_name', 'like', $like);
            });

        $this->applyTenantFilter($query, $tenantId);

        return $query
            ->orderBy('name')
            ->limit(self::LIMIT_PER_TYPE)
            ->get(['id', 'name', 'email', 'city', 'tenant_id'])
            ->map(fn (Client $client) => [
                'id' => $client->id,
                'type' => 'client',
                'label' => $client->name,
                'subtitle' => $client->email ?? $client->city,
                'path' => '/clients',
                'state' => ['prefillSearch' => $client->name],
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchProjects(int $companyId, string $like, ?int $tenantId): array
    {
        $query = Project::query()
            ->forCompany($companyId)
            ->where(function ($builder) use ($like): void {
                $builder->where('title', 'like', $like)
                    ->orWhere('reference', 'like', $like);
            });

        $this->applyTenantFilter($query, $tenantId);

        return $query
            ->orderBy('title')
            ->limit(self::LIMIT_PER_TYPE)
            ->get(['id', 'title', 'reference', 'tenant_id'])
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'type' => 'project',
                'label' => $project->title,
                'subtitle' => $project->reference,
                'path' => '/projects/'.$project->id,
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function searchTasks(int $companyId, string $like, ?int $tenantId): array
    {
        $query = Task::query()
            ->with(['phase.project:id,title,reference'])
            ->where('title', 'like', $like)
            ->whereHas('phase.project', fn ($builder) => $builder->forCompany($companyId));

        $this->applyTenantFilter($query, $tenantId);

        return $query
            ->orderBy('title')
            ->limit(self::LIMIT_PER_TYPE)
            ->get()
            ->map(function (Task $task) {
                $project = $task->phase?->project;

                return [
                    'id' => $task->id,
                    'type' => 'task',
                    'label' => $task->title,
                    'subtitle' => $project?->title ?? $project?->reference,
                    'path' => $project ? '/projects/'.$project->id : '/tasks',
                ];
            })
            ->all();
    }

    private function applyTenantFilter($query, ?int $tenantId): void
    {
        if ($tenantId !== null) {
            $query->where($query->getModel()->getTable().'.tenant_id', $tenantId);
        }
    }

    /**
     * @return array{
     *   tenants: list<array<string, mixed>>,
     *   clients: list<array<string, mixed>>,
     *   projects: list<array<string, mixed>>,
     *   tasks: list<array<string, mixed>>
     * }
     */
    private function emptyResult(): array
    {
        return [
            'tenants' => [],
            'clients' => [],
            'projects' => [],
            'tasks' => [],
        ];
    }
}
