import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAY_LABELS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export default function PortalMonthCalendar({ milestones = [], emptyLabel }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month])

  const milestonesByDay = useMemo(() => {
    const map = new Map()

    milestones.forEach((milestone) => {
      if (!milestone.due_date) {
        return
      }

      const date = new Date(milestone.due_date)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const existing = map.get(key) ?? []
      existing.push(milestone)
      map.set(key, existing)
    })

    return map
  }, [milestones])

  const monthLabel = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  }).format(viewDate)

  const weekdayLabels = WEEKDAY_LABELS_FR

  function shiftMonth(delta) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/[0.04]"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-base font-semibold capitalize text-white">{monthLabel}</h3>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/[0.04]"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wide text-slate-500">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-2">{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((day, index) => {
          const isToday = day !== null
            && day === today.getDate()
            && month === today.getMonth()
            && year === today.getFullYear()

          const dayKey = day !== null ? `${year}-${month}-${day}` : null
          const dayMilestones = dayKey ? (milestonesByDay.get(dayKey) ?? []) : []

          return (
            <div
              key={`${year}-${month}-${index}`}
              className={[
                'min-h-[72px] rounded-xl border px-2 py-2 text-left sm:min-h-[88px]',
                day === null
                  ? 'border-transparent bg-transparent'
                  : 'border-[var(--pg-border)] bg-[var(--pg-bg-elevated)]',
                isToday ? 'ring-1 ring-[rgba(34,197,94,0.45)]' : '',
              ].join(' ')}
            >
              {day !== null ? (
                <>
                  <span className={`text-sm font-medium ${isToday ? 'text-[var(--pg-accent)]' : 'text-slate-300'}`}>
                    {day}
                  </span>
                  {dayMilestones.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {dayMilestones.slice(0, 2).map((milestone) => (
                        <li
                          key={milestone.id}
                          className="truncate bg-[var(--pg-accent-dim)] px-1.5 py-0.5 text-[10px] text-[var(--pg-accent-soft)]"
                          title={milestone.title}
                        >
                          {milestone.title}
                        </li>
                      ))}
                      {dayMilestones.length > 2 ? (
                        <li className="text-[10px] text-slate-500">+{dayMilestones.length - 2}</li>
                      ) : null}
                    </ul>
                  ) : null}
                </>
              ) : null}
            </div>
          )
        })}
      </div>

      {milestones.length === 0 ? (
        <p className="pg-inner-tile px-4 py-6 text-center text-sm text-[var(--pg-text-dim)]">
          {emptyLabel}
        </p>
      ) : null}
    </div>
  )
}
