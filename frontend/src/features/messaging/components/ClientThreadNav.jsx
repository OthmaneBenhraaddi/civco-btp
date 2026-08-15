import { buildThreadKey } from '../threadKeys'

function UnreadBadge({ count }) {
  if (!count) {
    return null
  }

  return (
    <span className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
      {count}
    </span>
  )
}

function ThreadButton({ active, label, unreadCount, onClick, indent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm transition-colors',
        indent ? 'pl-8 pr-4' : 'px-4',
        active
          ? 'bg-[var(--pg-accent-dim)] font-medium text-white'
          : unreadCount
            ? 'bg-amber-500/[0.06] text-white hover:bg-amber-500/[0.09]'
            : 'text-slate-300 hover:bg-white/[0.03]',
        unreadCount && !active ? 'border-l-2 border-amber-400/80' : 'border-l-2 border-transparent',
      ].join(' ')}
    >
      <span className="truncate">{label}</span>
      <UnreadBadge count={unreadCount} />
    </button>
  )
}

export default function ClientThreadNav({
  threads,
  selectedThreadKey,
  loading,
  onSelect,
  t,
}) {
  if (loading) {
    return <p className="px-4 py-6 text-sm text-slate-500">{t('common.loading')}</p>
  }

  if (!threads) {
    return (
      <p className="pg-inner-tile mx-4 my-6 px-4 py-8 text-center text-sm text-[var(--pg-text-dim)]">
        {t('clientPortal.noThreads')}
      </p>
    )
  }

  const projects = threads.projects ?? []

  return (
    <nav className="py-2" aria-label={t('clientPortal.threadsNav')}>
      <ThreadButton
        active={selectedThreadKey === buildThreadKey(null)}
        label={t('clientPortal.threadGeneral')}
        unreadCount={threads.general?.unread_count ?? 0}
        onClick={() => onSelect(buildThreadKey(null))}
      />

      {projects.length > 0 ? (
        <div className="mt-2">
          <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t('clientPortal.threadProjectsHeader')}
          </p>
          <ul>
            {projects.map((project) => {
              const threadKey = buildThreadKey(project.project_id)

              return (
                <li key={project.project_id}>
                  <ThreadButton
                    active={selectedThreadKey === threadKey}
                    label={`${project.reference} — ${project.title}`}
                    unreadCount={project.unread_count ?? 0}
                    onClick={() => onSelect(threadKey)}
                    indent
                  />
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </nav>
  )
}
