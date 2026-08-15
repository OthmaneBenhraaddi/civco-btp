function resolveContactSubtitle(contact, t) {
  if (contact.is_client) {
    return contact.email ?? t('messaging.clientAccount')
  }

  if (contact.job_title) {
    return contact.job_title
  }

  return contact.role === 'admin'
    ? t('clientPortal.contactAdmin')
    : t('clientPortal.contactStaff')
}

export default function PortalContactList({
  contacts,
  selectedContactId,
  loading,
  onSelect,
  t,
  emptyMessage,
}) {
  if (loading) {
    return <p className="px-4 py-6 text-sm text-slate-500">{t('common.loading')}</p>
  }

  if (contacts.length === 0) {
    return (
      <p className="pg-inner-tile mx-4 my-6 px-4 py-8 text-center text-sm text-[var(--pg-text-dim)]">
        {emptyMessage ?? t('messaging.noContacts')}
      </p>
    )
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {contacts.map((contact) => {
        const isActive = contact.id === selectedContactId
        const hasUnread = (contact.unread_count ?? 0) > 0

        return (
          <li key={contact.id}>
            <button
              type="button"
              onClick={() => onSelect(contact.id)}
              className={[
                'flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors',
                isActive
                  ? 'bg-[var(--pg-accent-dim)] text-white'
                  : hasUnread
                    ? 'bg-amber-500/[0.06] text-white hover:bg-amber-500/[0.09]'
                    : 'text-slate-300 hover:bg-white/[0.03]',
                hasUnread ? 'border-l-2 border-amber-400/80' : 'border-l-2 border-transparent',
              ].join(' ')}
            >
              <div className="min-w-0">
                <span className={`block truncate text-sm ${hasUnread ? 'font-semibold text-white' : 'font-medium'}`}>
                  {contact.full_name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {resolveContactSubtitle(contact, t)}
                </span>
              </div>
              {hasUnread ? (
                <span className="mt-0.5 inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                  {contact.unread_count}
                </span>
              ) : null}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
