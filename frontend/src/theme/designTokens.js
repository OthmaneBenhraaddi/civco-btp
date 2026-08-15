/** Shared Prodigy chamfer surface & component tokens. */

export const SURFACE = {
  canvas: 'bg-[#0b0f17]',
  card: 'bg-[#151c28]',
  sunken: 'bg-[#0e121b]',
  input: 'bg-[#111722]',
  popover: 'bg-[#0e121b]/90 backdrop-blur-md',
}

export const BENTO_CARD_CLASS =
  'pg-card bg-[var(--pg-card)] text-[var(--pg-text)]'

export const DASHBOARD_BENTO_CLASS = `${BENTO_CARD_CLASS} p-6`

export const PG_STAT_CLASS = 'pg-stat'

export const PG_STAT_ACCENT_CLASS = 'pg-stat is-accent'

export const PG_BADGE =
  'inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]'

export const PG_BADGE_TONES = {
  draft: 'border-[#334155] bg-[#0e121b] text-slate-400',
  pending: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] text-amber-300',
  success: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
  danger: 'border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-red-300',
  info: 'border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.1)] text-sky-300',
}

export const FIELD_CLASS =
  'w-full border-0 bg-[#111722] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'

export const LABEL_CLASS =
  'mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-[var(--pg-text-dim)]'

export const BTN_PRIMARY =
  'inline-flex items-center justify-center bg-[#22c55e] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-[#052e16] shadow-sm transition-all duration-200 hover:bg-[#4ade80] hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0'

export const BTN_GHOST =
  'inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-slate-400 transition-colors duration-200 hover:text-white'

export const PAGE_TITLE_CLASS = 'pg-section-title'

export const PAGE_SUBTITLE_CLASS = 'mt-2 max-w-xl text-sm leading-relaxed text-[var(--pg-text-muted)]'
