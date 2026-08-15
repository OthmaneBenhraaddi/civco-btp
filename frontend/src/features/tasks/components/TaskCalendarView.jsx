import { useMemo, useState } from 'react'
import { STATUT_CALENDAR_COLORS } from '../types'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const days = []

  for (let i = 0; i < startOffset; i += 1) {
    days.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day))
  }

  return days
}

function toIsoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function TaskCalendarView({ tasks, t }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const days = useMemo(() => buildCalendarDays(year, month), [year, month])

  const tasksByDate = useMemo(() => {
    const map = {}
    tasks.forEach((task) => {
      if (!map[task.echeance]) {
        map[task.echeance] = []
      }
      map[task.echeance].push(task)
    })
    return map
  }, [tasks])

  const monthLabel = viewDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  function shiftMonth(delta) {
    setViewDate(new Date(year, month + delta, 1))
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-[#16171B] shadow-xl shadow-black/25">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-5 py-4">
        <h3 className="text-base font-semibold capitalize text-zinc-100">{monthLabel}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="task-calendar-nav-btn rounded-lg border border-gray-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="task-calendar-nav-btn rounded-lg border border-gray-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            {t('tasks.calendar.today')}
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="task-calendar-nav-btn rounded-lg border border-gray-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-800 bg-[#121214]">
        {WEEKDAY_KEYS.map((key) => (
          <div key={key} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {t(`tasks.calendar.weekdays.${key}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-[110px] border-b border-r border-gray-800/60 bg-zinc-950/30" />
          }

          const iso = toIsoDate(date)
          const dayTasks = tasksByDate[iso] ?? []
          const isToday = iso === toIsoDate(today)

          return (
            <div
              key={iso}
              className={`min-h-[110px] border-b border-r border-gray-800/60 p-2 transition hover:bg-white/[0.02] ${isToday ? 'bg-indigo-950/20 ring-1 ring-inset ring-indigo-500/30' : ''}`}
            >
              <div className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${isToday ? 'bg-indigo-600 text-white' : 'text-zinc-400'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`truncate rounded-md px-2 py-1 text-[10px] font-medium leading-tight ${STATUT_CALENDAR_COLORS[task.statut]}`}
                    title={`${task.nom} — ${task.projectName}`}
                  >
                    {task.nom}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
