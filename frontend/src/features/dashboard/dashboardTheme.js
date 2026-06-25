export const DASHBOARD_CARD_CLASS =
  'rounded-2xl border border-gray-700/50 bg-[#1f2937] shadow-sm'

export const CHART_AXIS_TICK = { fill: '#9ca3af', fontSize: 12 }

export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3',
  vertical: false,
  stroke: '#374151',
}

export const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid rgba(55, 65, 81, 0.9)',
  backgroundColor: '#1f2937',
  color: '#f9fafb',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
}

export const CHART_TOOLTIP_LABEL_STYLE = { color: '#9ca3af' }

export const CHART_LEGEND_STYLE = {
  fontSize: '12px',
  paddingTop: '12px',
  color: '#9ca3af',
}

export const INTERVAL_CAPSULE_CLASS =
  'dashboard-interval-tabs flex items-center gap-1 rounded-xl border border-gray-700/60 bg-[#1f2937] p-1'

export function intervalTabClass(isActive) {
  if (isActive) {
    return 'dashboard-interval-tab rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all'
  }

  return 'dashboard-interval-tab rounded-lg bg-transparent px-3 py-1.5 text-xs font-medium text-gray-400 transition-all hover:text-slate-200'
}
