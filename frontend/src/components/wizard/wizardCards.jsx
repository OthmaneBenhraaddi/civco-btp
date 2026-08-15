import { Building2, Check, HardHat, Layers, Route } from 'lucide-react'

export const SECTOR_ICONS = {
  bâtiment: Building2,
  batiment: Building2,
  vrd: Route,
  'génie civil': HardHat,
  'genie civil': HardHat,
  hydraulique: Layers,
}

export function resolveSectorIcon(name = '') {
  const key = name.toLowerCase().trim()
  const Match = SECTOR_ICONS[key]
  if (Match) return Match
  if (key.includes('bât') || key.includes('bat')) return Building2
  if (key.includes('vrd')) return Route
  return HardHat
}

export function SectorCard({ sector, active, lotCount, lotLabel, onClick }) {
  const Icon = resolveSectorIcon(sector.name)
  const subtitle =
    lotLabel ??
    (lotCount != null ? `${lotCount} lot${lotCount !== 1 ? 's' : ''}` : null)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'wizard-sector-card group relative flex flex-col items-start overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200',
        active
          ? 'border-emerald-400/80 bg-emerald-500/[0.13] shadow-[0_0_0_1px_rgba(52,211,153,0.38),0_0_24px_rgba(34,197,94,0.2)]'
          : 'border-white/[0.08] bg-[#1c1d22] hover:border-white/15 hover:bg-[#16171b]',
      ].join(' ')}
    >
      {active ? (
        <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-emerald-400 text-[#052e16] shadow-[0_0_14px_rgba(74,222,128,0.55)]">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      ) : null}
      <span
        className={[
          'mb-3 flex h-10 w-10 items-center justify-center rounded-xl ring-1',
          active
            ? 'bg-emerald-400/20 text-emerald-300 ring-emerald-400/50'
            : 'bg-white/[0.04] text-slate-400 ring-white/[0.06] group-hover:text-slate-200',
        ].join(' ')}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="text-sm font-semibold text-white">{sector.name}</span>
      {subtitle ? (
        <span className="mt-1 text-xs text-slate-400">{subtitle}</span>
      ) : null}
    </button>
  )
}

export function TypeCard({ active, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'wizard-type-card relative flex flex-1 flex-col items-start justify-center overflow-hidden rounded-2xl border text-left transition-all duration-200',
        active
          ? 'border-emerald-400/80 bg-emerald-500/[0.13] shadow-[0_0_0_1px_rgba(52,211,153,0.38),0_0_24px_rgba(34,197,94,0.2)]'
          : 'border-white/[0.08] bg-[#1c1d22] hover:border-white/15 hover:bg-[#16171b]',
      ].join(' ')}
    >
      {active ? (
        <span className="wizard-type-card__check absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-emerald-400 text-[#052e16] shadow-[0_0_14px_rgba(74,222,128,0.55)]">
          <Check className="h-4 w-4" strokeWidth={3} />
        </span>
      ) : null}
      <span
        className={[
          'pr-8 text-sm font-bold uppercase tracking-[0.08em]',
          active ? 'text-emerald-300' : 'text-white',
        ].join(' ')}
      >
        {title}
      </span>
      {description ? (
        <span className="mt-1.5 max-w-[16rem] text-xs leading-snug text-slate-400">
          {description}
        </span>
      ) : null}
    </button>
  )
}
