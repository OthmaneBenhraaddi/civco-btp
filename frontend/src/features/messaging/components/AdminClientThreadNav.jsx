import { useEffect, useState } from 'react'
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

function ThreadButton({ active, label, unreadCount, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center justify-between gap-2 py-2 pl-8 pr-4 text-left text-sm transition-colors',
        active
          ? 'bg-indigo-500/10 font-medium text-white'
          : unreadCount
            ? 'text-white hover:bg-amber-500/[0.06]'
            : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200',
      ].join(' ')}
    >
      <span className="truncate">{label}</span>
      <UnreadBadge count={unreadCount} />
    </button>
  )
}

export default function AdminClientThreadNav({
  clientGroups,
  selectedClientUserId,
  selectedThreadKey,
  loading,
  onSelectThread,
  t,
}) {
  const [expandedClientIds, setExpandedClientIds] = useState(() => new Set())

  useEffect(() => {
    if (selectedClientUserId) {
      setExpandedClientIds((current) => {
        if (current.has(selectedClientUserId)) {
          return current
        }

        return new Set(current).add(selectedClientUserId)
      })
    }
  }, [selectedClientUserId])

  if (loading) {
    return <p className="px-4 py-6 text-sm text-slate-500">{t('common.loading')}</p>
  }

  if (!clientGroups?.length) {
    return (
      <p className="mx-4 my-6 rounded-xl border border-dashed border-white/[0.08] bg-[#121316] px-4 py-8 text-center text-sm text-slate-500">
        {t('messaging.noClients')}
      </p>
    )
  }

  function toggleClient(clientUserId) {
    setExpandedClientIds((current) => {
      const next = new Set(current)

      if (next.has(clientUserId)) {
        next.delete(clientUserId)
      } else {
        next.add(clientUserId)
      }

      return next
    })
  }

  function preferredThreadKey(group) {
    const threads = group.threads ?? []
    const projectThread = threads.find((thread) => thread.project_id != null)

    if (projectThread) {
      return buildThreadKey(projectThread.project_id)
    }

    const generalThread = threads.find((thread) => thread.project_id == null)

    return buildThreadKey(generalThread?.project_id ?? null)
  }

  function handleClientClick(group) {
    const isExpanded = expandedClientIds.has(group.client_user_id)
    toggleClient(group.client_user_id)

    if (!isExpanded) {
      onSelectThread(group.client_user_id, preferredThreadKey(group))
    }
  }

  return (
    <nav className="divide-y divide-white/[0.06]" aria-label={t('messaging.clientsNav')}>
      {clientGroups.map((group) => {
        const isExpanded = expandedClientIds.has(group.client_user_id)
        const isClientActive = selectedClientUserId === group.client_user_id
        const hasUnread = (group.unread_count ?? 0) > 0

        return (
          <div key={group.client_user_id}>
            <button
              type="button"
              onClick={() => handleClientClick(group)}
              className={[
                'flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                isClientActive
                  ? 'bg-white/[0.03] text-white'
                  : hasUnread
                    ? 'bg-amber-500/[0.06] text-white hover:bg-amber-500/[0.09]'
                    : 'text-slate-300 hover:bg-white/[0.03]',
              ].join(' ')}
            >
              <div className="min-w-0">
                <span className={`block truncate text-sm ${hasUnread ? 'font-semibold' : 'font-medium'}`}>
                  {group.client_name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {group.client_email}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <UnreadBadge count={group.unread_count} />
                <span className="text-xs text-slate-500">{isExpanded ? '▾' : '▸'}</span>
              </div>
            </button>

            {isExpanded ? (
              <div className="border-t border-white/[0.04] bg-[#0f1012]/60 pb-2">
                {(group.threads ?? []).map((thread) => {
                  const threadKey = buildThreadKey(thread.project_id)
                  const isActive = isClientActive && selectedThreadKey === threadKey
                  const label = thread.project_id == null
                    ? t('messaging.threadGeneral')
                    : `${thread.reference} — ${thread.title}`

                  return (
                    <ThreadButton
                      key={threadKey}
                      active={isActive}
                      label={label}
                      unreadCount={thread.unread_count ?? 0}
                      onClick={() => onSelectThread(group.client_user_id, threadKey)}
                    />
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
