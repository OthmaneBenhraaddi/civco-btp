import { useMemo } from 'react'

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ProgressRing({ percent = 0, label }) {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0))
  const offset = CIRCUMFERENCE - (safePercent / 100) * CIRCUMFERENCE

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-white/[0.06]"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="url(#portalProgressGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="portalProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-white">{Math.round(safePercent)}%</span>
          {label ? <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span> : null}
        </div>
      </div>
    </div>
  )
}

export function ProgressBar({ percent = 0, label }) {
  const safePercent = Math.min(100, Math.max(0, Number(percent) || 0))

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{label}</span>
          <span className="font-medium text-white">{Math.round(safePercent)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-700"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  )
}

export function useWeekLabel(locale) {
  return useMemo(() => {
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + 6)
    const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
    })
    return `${fmt.format(now)} – ${fmt.format(end)}`
  }, [locale])
}
