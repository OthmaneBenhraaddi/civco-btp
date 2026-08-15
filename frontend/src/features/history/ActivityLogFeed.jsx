import {
  ACTION_BADGE_CLASS,
  ACTION_DOT_CLASS,
  actionBadgeLabel,
  formatAuditTime,
} from './auditLogStore'

export default function ActivityLogFeed({
  logs,
  loading = false,
  emptyLabel,
  page = 1,
  lastPage = 1,
  onPageChange,
  t,
}) {
  if (loading && logs.length === 0) {
    return <p className="text-sm text-slate-500">{t('common.loading')}</p>
  }

  if (!loading && logs.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>
  }

  return (
    <>
      <div className="relative min-h-[12rem]">
        <div
          className="pointer-events-none absolute bottom-0 left-[5px] top-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.06] to-transparent"
          aria-hidden
        />

        <ul className="m-0 max-h-[min(36rem,70vh)] list-none overflow-y-auto p-0 pr-1 custom-scrollbar">
          {logs.map((log, index) => (
            <li
              key={log.id}
              className={[
                'relative grid grid-cols-[12px_1fr] gap-x-4 pb-8',
                index === logs.length - 1 ? 'pb-0' : '',
              ].join(' ')}
            >
              <div className="relative flex justify-center pt-1.5">
                <span
                  className={[
                    'relative z-[1] h-2.5 w-2.5 rounded-full ring-2 ring-[#0b0f17]',
                    ACTION_DOT_CLASS[log.action] ?? ACTION_DOT_CLASS.modification,
                  ].join(' ')}
                  aria-hidden
                />
              </div>

              <div className="min-w-0 border-b border-white/[0.04] pb-6 last:border-b-0">
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-medium text-white">{log.actor}</span>
                  <time className="text-xs tabular-nums text-slate-500">
                    {formatAuditTime(log.timestamp ?? log.created_at)}
                  </time>
                  <span
                    className={[
                      'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      ACTION_BADGE_CLASS[log.action] ?? ACTION_BADGE_CLASS.modification,
                    ].join(' ')}
                  >
                    {actionBadgeLabel(log.action, t)}
                  </span>
                  {log.tenant_name ? (
                    <span className="bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-[var(--pg-accent)]">
                      {log.tenant_name}
                    </span>
                  ) : null}
                  {log.project_title ? (
                    <span className="text-[11px] text-slate-500">
                      {log.project_reference ? `${log.project_reference} · ` : ''}{log.project_title}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{log.message ?? log.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {lastPage > 1 ? (
        <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5 text-xs text-slate-500">
          <button
            type="button"
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 transition hover:bg-white/[0.04] disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            {t('common.previous')}
          </button>
          <span>{t('history.pageOf', { current: page, total: lastPage })}</span>
          <button
            type="button"
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 transition hover:bg-white/[0.04] disabled:opacity-40"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            {t('common.next')}
          </button>
        </div>
      ) : null}
    </>
  )
}
