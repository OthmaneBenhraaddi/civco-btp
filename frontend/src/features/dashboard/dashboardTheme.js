import { BENTO_CARD_CLASS } from '../../theme/designTokens'

// Set to false to restore the previous dashboard presentation.
export const DASHBOARD_COC_ENABLED = true
export const DASHBOARD_COC_CLASS = DASHBOARD_COC_ENABLED ? 'dashboard--coc' : ''

export const DASHBOARD_CARD_CLASS = BENTO_CARD_CLASS

export const CHART_AXIS_TICK = { fill: '#8b9bb0', fontSize: 11 }

export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3',
  vertical: false,
  stroke: 'rgba(42, 54, 74, 0.9)',
}

export const CHART_TOOLTIP_STYLE = {
  borderRadius: '0',
  border: '1px solid #2a364a',
  backgroundColor: 'rgba(14, 18, 27, 0.96)',
  color: '#f8fafc',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
  backdropFilter: 'blur(12px)',
}

export const CHART_TOOLTIP_LABEL_STYLE = { color: '#b6c2d4' }

export const CHART_LEGEND_STYLE = {
  fontSize: '11px',
  paddingTop: '12px',
  color: '#8b9bb0',
}

export const INTERVAL_CAPSULE_CLASS =
  'dashboard-interval-tabs flex items-center gap-1 pg-card p-1'

export function intervalTabClass(isActive) {
  if (isActive) {
    return 'dashboard-interval-tab px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pg-accent)] bg-[var(--pg-accent-dim)] transition-all'
  }

  return 'dashboard-interval-tab px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-all hover:text-slate-200'
}
