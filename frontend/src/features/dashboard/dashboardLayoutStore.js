const STORAGE_KEY = 'btp-dashboard-layout'

export const DASHBOARD_WIDGET_IDS = [
  'kpis',
  'taskOverview',
  'chantierDistribution',
  'dailySchedule',
  'workspaceCalendar',
  'financialActivity',
  'recentProjects',
]

export const DASHBOARD_WIDGET_LAYOUT = {
  kpis: { colSpan: 'col-span-12' },
  taskOverview: { colSpan: 'col-span-12 lg:col-span-8' },
  chantierDistribution: { colSpan: 'col-span-12 lg:col-span-4' },
  dailySchedule: { colSpan: 'col-span-12 lg:col-span-4' },
  workspaceCalendar: { colSpan: 'col-span-12 lg:col-span-4' },
  financialActivity: { colSpan: 'col-span-12 lg:col-span-8' },
  recentProjects: { colSpan: 'col-span-12 lg:col-span-8' },
}

export function getDefaultDashboardLayout() {
  return [...DASHBOARD_WIDGET_IDS]
}

function normalizeLayout(order) {
  if (!Array.isArray(order)) {
    return getDefaultDashboardLayout()
  }

  const valid = order.filter((id) => DASHBOARD_WIDGET_IDS.includes(id))
  const missing = DASHBOARD_WIDGET_IDS.filter((id) => !valid.includes(id))

  return [...valid, ...missing]
}

export function readDashboardLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return getDefaultDashboardLayout()
    }

    const parsed = JSON.parse(raw)
    return normalizeLayout(parsed.order ?? parsed)
  } catch {
    return getDefaultDashboardLayout()
  }
}

export function saveDashboardLayout(order) {
  const normalized = normalizeLayout(order)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: normalized, savedAt: new Date().toISOString() }))
  return normalized
}

export function reorderDashboardLayout(order, sourceId, targetId) {
  if (sourceId === targetId) {
    return order
  }

  const next = [...order]
  const sourceIndex = next.indexOf(sourceId)
  const targetIndex = next.indexOf(targetId)

  if (sourceIndex === -1 || targetIndex === -1) {
    return order
  }

  next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, sourceId)

  return next
}
