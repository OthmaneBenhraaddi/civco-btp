<?php

namespace App\Services;

class PermissionResolver
{
    /**
     * Semantic permission flags expand into granular API permissions.
     *
     * @var array<string, list<string>>
     */
    private const SEMANTIC_EXPANSIONS = [
        'view_financials' => ['quote.view', 'invoice.view', 'delivery_form.view'],
        'manage_financials' => ['quote.manage', 'invoice.manage', 'delivery_form.manage', 'payment.record'],
        'manage_tasks' => ['task.view_all', 'task.assign', 'task.update'],
        'edit_clients' => ['client.create', 'client.update'],
        'view_clients' => ['client.view'],
        'manage_projects' => ['project.create', 'project.update', 'project.delete', 'project.budget'],
    ];

    /**
     * @param  list<string>  $userSlugs
     */
    public function userHas(array $userSlugs, string $required): bool
    {
        if (in_array($required, $userSlugs, true)) {
            return true;
        }

        $expanded = $this->expand($userSlugs);

        if (in_array($required, $expanded, true)) {
            return true;
        }

        foreach (self::SEMANTIC_EXPANSIONS as $semantic => $granular) {
            if (in_array($semantic, $userSlugs, true) && in_array($required, $granular, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  list<string>  $userSlugs
     * @return list<string>
     */
    public function expand(array $userSlugs): array
    {
        $expanded = $userSlugs;

        foreach ($userSlugs as $slug) {
            foreach (self::SEMANTIC_EXPANSIONS[$slug] ?? [] as $implied) {
                $expanded[] = $implied;
            }
        }

        return array_values(array_unique($expanded));
    }

    /**
     * @return array<string, list<string>>
     */
    public function semanticExpansions(): array
    {
        return self::SEMANTIC_EXPANSIONS;
    }
}
