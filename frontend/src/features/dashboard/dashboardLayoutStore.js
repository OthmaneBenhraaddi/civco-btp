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

/** Preferred width on a 12-column grid (xl breakpoint). Rows are packed to always sum to 12. */
export const DASHBOARD_WIDGET_COL_SPAN = {
  kpis: 12,
  taskOverview: 7,
  chantierDistribution: 5,
  dailySchedule: 4,
  workspaceCalendar: 4,
  financialActivity: 8,
  recentProjects: 12,
}

const XL_COL_SPAN_CLASS = {
  1: 'xl:col-span-1',
  2: 'xl:col-span-2',
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  5: 'xl:col-span-5',
  6: 'xl:col-span-6',
  7: 'xl:col-span-7',
  8: 'xl:col-span-8',
  9: 'xl:col-span-9',
  10: 'xl:col-span-10',
  11: 'xl:col-span-11',
  12: 'xl:col-span-12',
}

export function getWidgetColSpanClass(span) {
  const safe = Math.min(12, Math.max(1, span))
  if (safe === 12) {
    return 'col-span-12'
  }
  return `col-span-12 ${XL_COL_SPAN_CLASS[safe]}`
}

/**
 * Pack widgets into grid rows that always fill 12 columns — no leftover gaps when reordering.
 */
export function packDashboardLayout(order) {
  const packed = []
  let row = []
  let used = 0

  function flushRow(expandLast) {
    if (row.length === 0) {
      return
    }

    if (expandLast) {
      const total = row.reduce((sum, widget) => sum + widget.colSpan, 0)
      if (total < 12) {
        row[row.length - 1].colSpan += 12 - total
      }
    }

    packed.push(...row)
    row = []
    used = 0
  }

  for (const id of order) {
    const preferred = DASHBOARD_WIDGET_COL_SPAN[id] ?? 12

    if (used > 0 && used + preferred > 12) {
      flushRow(true)
    }

    const span = preferred >= 12 ? 12 : preferred
    row.push({ id, colSpan: span })
    used += span

    if (used >= 12) {
      flushRow(false)
    }
  }

  flushRow(true)

  return packed
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
