import { useTranslation } from '../../i18n/LanguageContext'
import {
  ACTION_BADGE_CLASS,
  ACTION_DOT_CLASS,
  actionBadgeLabel,
  formatAuditTime,
} from './auditLogStore'
import { useAuditLogs } from './useAuditLogs'

export default function HistoryLog() {
  const { t, locale } = useTranslation()
  const auditLogs = useAuditLogs()

  return (
    <article className="w-full rounded-2xl border border-slate-800/80 bg-[#1f2937] p-6 text-white shadow-xl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {t('history.title')}
        </h2>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {t('history.liveMonitoring')}
        </span>
      </header>

      {auditLogs.length === 0 ? (
        <p className="text-sm text-slate-500">{t('history.empty')}</p>
      ) : (
        <ul className="max-h-[min(32rem,70vh)] overflow-y-auto pr-1 custom-scrollbar">
          {auditLogs.map((log) => (
            <li
              key={log.id}
              className="relative border-l border-slate-800 pb-6 pl-6 last:pb-0"
            >
              <span
                className={[
                  'absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4',
                  ACTION_DOT_CLASS[log.action] ?? ACTION_DOT_CLASS.modification,
                ].join(' ')}
                aria-hidden
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{log.actor}</span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {formatAuditTime(log.timestamp, locale)}
                    </span>
                    <span
                      className={[
                        'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        ACTION_BADGE_CLASS[log.action] ?? ACTION_BADGE_CLASS.modification,
                      ].join(' ')}
                    >
                      {actionBadgeLabel(log.action, t)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{log.message}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
