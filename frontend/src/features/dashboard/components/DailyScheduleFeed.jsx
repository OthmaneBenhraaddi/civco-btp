import { useTranslation } from '../../../i18n/LanguageContext'
import { DAILY_SCHEDULE_EVENTS } from '../dashboardChartData'
import { DASHBOARD_CARD_CLASS } from '../dashboardTheme'

export default function DailyScheduleFeed() {
  const { t } = useTranslation()

  return (
    <article className={`p-5 ${DASHBOARD_CARD_CLASS}`}>
      <h3 className="mb-4 text-sm font-semibold text-white">{t('dashboard.dailySchedule')}</h3>

      <ul className="space-y-3">
        {DAILY_SCHEDULE_EVENTS.map((event) => (
          <li
            key={event.id}
            className="rounded-xl border border-gray-700/50 bg-[#111827]/60 px-3.5 py-3 transition hover:border-gray-600/60 hover:bg-[#111827]"
          >
            <div className="flex items-start gap-3">
              <time className="shrink-0 pt-0.5 text-xs font-bold tabular-nums text-gray-400">
                {event.time}
              </time>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{t(event.titleKey)}</p>
                <span
                  className={[
                    'mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    event.tagColor,
                  ].join(' ')}
                >
                  {t(event.tagKey)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}
