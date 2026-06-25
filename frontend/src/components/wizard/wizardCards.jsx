import { Building2, HardHat, Layers, Route } from 'lucide-react'

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
      className={[
        'wizard-sector-card group flex flex-col items-start rounded-2xl border p-5 text-left transition-all duration-200',
        active
          ? 'border-indigo-500/50 bg-[#1c1d22] shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_0_20px_rgba(99,102,241,0.12)]'
          : 'border-white/[0.08] bg-[#1c1d22] hover:border-white/15 hover:bg-[#16171b]',
      ].join(' ')}
    >
      <span
        className={[
          'mb-3 flex h-10 w-10 items-center justify-center rounded-xl ring-1',
          active
            ? 'bg-indigo-500/20 text-indigo-300 ring-indigo-500/30'
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
      className={[
        'wizard-type-card flex flex-1 flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200',
        active
          ? 'border-indigo-500/50 bg-[#1c1d22] shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_0_20px_rgba(99,102,241,0.12)]'
          : 'border-white/[0.08] bg-[#1c1d22] hover:border-white/15 hover:bg-[#16171b]',
      ].join(' ')}
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      {description ? (
        <span className="mt-1 text-xs text-slate-400">{description}</span>
      ) : null}
    </button>
  )
}
