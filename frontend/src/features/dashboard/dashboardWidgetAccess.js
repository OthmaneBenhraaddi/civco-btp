/**
 * Dashboard widget visibility aligned with role permissions.
 */

export function canViewDashboardWidget(widgetId, hasPermission) {
  switch (widgetId) {
    case 'kpis':
      return hasPermission('dashboard.view')
    case 'taskOverview':
      return hasPermission('project.view') || hasPermission('task.view_all') || hasPermission('task.view_own')
    case 'chantierDistribution':
    case 'recentProjects':
      return hasPermission('project.view')
    case 'financialActivity':
      return hasPermission('invoice.view') || hasPermission('quote.view')
    case 'dailySchedule':
    case 'workspaceCalendar':
      return hasPermission('project.view')
    default:
      return false
  }
}

export function canViewOperationalKpis(hasPermission) {
  return hasPermission('project.view')
}

export function canViewFinancialKpis(hasPermission) {
  return hasPermission('invoice.view') || hasPermission('quote.view')
}

export function filterDashboardLayout(order, hasPermission) {
  return order.filter((widgetId) => canViewDashboardWidget(widgetId, hasPermission))
}
