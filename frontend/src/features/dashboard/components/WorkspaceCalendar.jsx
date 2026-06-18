import { useMemo, useState } from 'react'
import { useTranslation } from '../../../i18n/LanguageContext'
import { DASHBOARD_CARD_CLASS } from '../dashboardTheme'

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startOffset = (firstDay.getDay() + 6) % 7

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

function IconChevronLeft({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconChevronRight({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function WorkspaceCalendar() {
  const { t, locale } = useTranslation()
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 5, 1))

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
      month: 'long',
      year: 'numeric',
    }).format(currentDate),
    [currentDate, locale],
  )

  const cells = useMemo(() => buildMonthGrid(year, month), [month, year])

  function goToPreviousMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  return (
    <article className={`p-5 text-white ${DASHBOARD_CARD_CLASS}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold capitalize text-white">{monthLabel}</h3>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="dashboard-calendar-nav rounded-lg p-1 text-gray-400 transition-all hover:bg-gray-700/50 hover:text-white"
            aria-label={t('dashboard.calendar.previousMonth')}
          >
            <IconChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="dashboard-calendar-nav rounded-lg p-1 text-gray-400 transition-all hover:bg-gray-700/50 hover:text-white"
            aria-label={t('dashboard.calendar.nextMonth')}
          >
            <IconChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_KEYS.map((key) => (
          <span
            key={key}
            className="pb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
          >
            {t(`dashboard.calendar.weekdays.${key}`)}
          </span>
        ))}

        {cells.map((day, index) => {
          if (day == null) {
            return <span key={`empty-${index}`} className="aspect-square" aria-hidden />
          }

          const isToday =
            day === today.getDate()
            && month === today.getMonth()
            && year === today.getFullYear()

          return (
            <span
              key={`${year}-${month}-${day}`}
              className="flex aspect-square items-center justify-center"
            >
              <button
                type="button"
                className={[
                  'calendar-day-btn flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition',
                  isToday
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-transparent text-gray-400 hover:bg-gray-700/40 hover:text-white',
                ].join(' ')}
                aria-current={isToday ? 'date' : undefined}
              >
                {day}
              </button>
            </span>
          )
        })}
      </div>
    </article>
  )
}
