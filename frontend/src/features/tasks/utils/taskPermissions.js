/**
 * Task visibility and write access aligned with backend TaskAuthorizationService.
 */

export function canManageAllTasks({ isAdmin, hasPermission }) {
  return isAdmin
    || hasPermission('task.view_all')
    || hasPermission('task.assign')
    || hasPermission('manage_tasks')
}

export function canCreateTasks(access) {
  return canManageAllTasks(access)
}

export function canManageTask(task, { user, isAdmin, hasPermission }) {
  if (canManageAllTasks({ isAdmin, hasPermission })) {
    return true
  }

  if (!hasPermission('task.update') && !hasPermission('project.update')) {
    return false
  }

  const assigneeId = task.assignedToUserId ?? task.assigned_to_user_id

  return assigneeId != null && String(assigneeId) === String(user?.id)
}

export function filterVisibleTasks(tasks, access) {
  if (canManageAllTasks(access)) {
    return tasks
  }

  if (access.hasPermission('task.view_own') || access.hasPermission('task.update')) {
    return tasks.filter((task) => canManageTask(task, access))
  }

  return tasks
}
