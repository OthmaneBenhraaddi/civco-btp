<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;

class TaskAuthorizationService
{
    public function __construct(
        private readonly PermissionResolver $permissionResolver,
    ) {}

    /**
     * @param  list<string>  $permissionSlugs
     */
    public function canManageAllTasks(User $user, array $permissionSlugs): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $this->permissionResolver->userHas($permissionSlugs, 'task.view_all')
            || $this->permissionResolver->userHas($permissionSlugs, 'task.assign');
    }

    /**
     * @param  list<string>  $permissionSlugs
     */
    public function canCreateTasks(User $user, array $permissionSlugs): bool
    {
        return $this->canManageAllTasks($user, $permissionSlugs);
    }

    /**
     * @param  list<string>  $permissionSlugs
     */
    public function canManageTask(User $user, Task $task, array $permissionSlugs): bool
    {
        if ($this->canManageAllTasks($user, $permissionSlugs)) {
            return true;
        }

        if (! $this->permissionResolver->userHas($permissionSlugs, 'task.update')
            && ! $this->permissionResolver->userHas($permissionSlugs, 'project.update')) {
            return false;
        }

        return $task->assigned_to_user_id !== null
            && (int) $task->assigned_to_user_id === (int) $user->id;
    }

    /**
     * @param  list<string>  $permissionSlugs
     */
    public function canViewTask(User $user, Task $task, array $permissionSlugs): bool
    {
        if ($this->canManageAllTasks($user, $permissionSlugs)) {
            return true;
        }

        if ($this->permissionResolver->userHas($permissionSlugs, 'task.view_own')
            || $this->permissionResolver->userHas($permissionSlugs, 'task.update')) {
            return $task->assigned_to_user_id !== null
                && (int) $task->assigned_to_user_id === (int) $user->id;
        }

        return $this->permissionResolver->userHas($permissionSlugs, 'project.view');
    }
}
