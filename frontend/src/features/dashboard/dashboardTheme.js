import { BENTO_CARD_CLASS } from '../../theme/designTokens'

export const DASHBOARD_CARD_CLASS = `${BENTO_CARD_CLASS} shadow-2xl shadow-black/40`

export const CHART_AXIS_TICK = { fill: '#64748b', fontSize: 11 }

export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3',
  vertical: false,
  stroke: 'rgba(255,255,255,0.06)',
}

export const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.08)',
  backgroundColor: 'rgba(15, 17, 23, 0.95)',
  color: '#f9fafb',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
  backdropFilter: 'blur(12px)',
}

export const CHART_TOOLTIP_LABEL_STYLE = { color: '#94a3b8' }

export const CHART_LEGEND_STYLE = {
  fontSize: '11px',
  paddingTop: '12px',
  color: '#94a3b8',
}

export const INTERVAL_CAPSULE_CLASS =
  'dashboard-interval-tabs flex items-center gap-1 rounded-xl border border-white/[0.06] bg-[#121316] p-1'

export function intervalTabClass(isActive) {
  if (isActive) {
    return 'dashboard-interval-tab rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-white transition-all'
  }

  return 'dashboard-interval-tab rounded-lg bg-transparent px-3 py-1.5 text-xs font-medium text-slate-500 transition-all hover:text-slate-300'
}
