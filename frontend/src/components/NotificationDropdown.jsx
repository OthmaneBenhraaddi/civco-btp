import { useCallback, useEffect, useRef, useState } from 'react'
import * as notificationsApi from '../api/notifications'
import { useTranslation } from '../i18n/LanguageContext'
import { formatRelativeTime } from '../utils/formatRelativeTime'

function IconBell({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 004 0" strokeLinecap="round" />
    </svg>
  )
}

export default function NotificationDropdown() {
  const { t, locale } = useTranslation()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingId, setMarkingId] = useState(null)

  const loadNotifications = useCallback(async () => {
    setLoading(true)

    try {
      const { items: nextItems, unreadCount: count } = await notificationsApi.fetchUnreadNotifications()
      setItems(nextItems)
      setUnreadCount(count)
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function toggleOpen() {
    setOpen((value) => {
      const next = !value
      if (next) {
        loadNotifications()
      }
      return next
    })
  }

  async function handleNotificationClick(notification) {
    if (markingId === notification.id) {
      return
    }

    setMarkingId(notification.id)

    try {
      const { unreadCount: count } = await notificationsApi.markNotificationAsRead(notification.id)
      setItems((current) => current.filter((item) => item.id !== notification.id))
      setUnreadCount(count)
    } catch {
    } finally {
      setMarkingId(null)
    }
  }

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)

  return (
    <div ref={rootRef} className="relative flex h-full items-center">
      <button
        type="button"
        aria-label={t('layout.notifications')}
        aria-expanded={open}
        aria-controls="notification-dropdown-panel"
        onClick={toggleOpen}
        className={[
          'app-header-icon-btn relative rounded-lg p-2 transition-colors duration-150',
          open ? 'bg-white/[0.04] text-slate-200' : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-200',
        ].join(' ')}
      >
        <IconBell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-0.5 text-[9px] font-semibold leading-none text-slate-900 ring-2 ring-[#141519]"
            aria-label={t('notifications.unreadCount', { count: unreadCount })}
          >
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id="notification-dropdown-panel"
          className="absolute right-0 top-full z-50 mt-2.5 w-[min(20rem,calc(100vw-3rem))] overflow-hidden rounded-lg border border-slate-700/50 bg-[#141519] shadow-2xl shadow-black/60"
        >
          <div className="border-b border-slate-800/60 px-4 py-3">
            <p className="text-[13px] font-semibold tracking-tight text-slate-200">
              {t('notifications.title')}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {unreadCount > 0
                ? t('notifications.subtitleUnread', { count: unreadCount })
                : t('notifications.subtitleEmpty')}
            </p>
          </div>

          <div className="max-h-[min(22rem,58vh)] overflow-y-auto overscroll-contain">
            {loading && items.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-slate-500">{t('notifications.loading')}</p>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-[13px] font-medium text-slate-300">{t('notifications.emptyTitle')}</p>
                <p className="mx-auto mt-1.5 max-w-[14rem] text-xs leading-relaxed text-slate-500">
                  {t('notifications.emptyBody')}
                </p>
              </div>
            ) : null}

            {items.length > 0 ? (
              <ul className="m-0 list-none p-0">
                {items.map((notification, index) => {
                  const isMarking = markingId === notification.id
                  const isLast = index === items.length - 1

                  return (
                    <li key={notification.id} className="m-0 list-none p-0">
                      <button
                        type="button"
                        disabled={isMarking}
                        onClick={() => handleNotificationClick(notification)}
                        className={[
                          'group w-full px-4 py-3.5 text-left transition-colors duration-150',
                          'border-slate-800/50 hover:bg-white/[0.03] focus:outline-none focus-visible:bg-white/[0.03]',
                          isLast ? 'border-b-0' : 'border-b',
                          isMarking ? 'opacity-50' : '',
                        ].join(' ')}
                      >
                        <div className="flex gap-3">
                          <span className="mt-[5px] flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className="text-[13px] font-medium leading-snug text-slate-200">
                                {notification.title}
                              </span>
                              <time
                                dateTime={notification.created_at}
                                className="shrink-0 pt-px text-[10px] font-normal tabular-nums text-slate-500"
                              >
                                {formatRelativeTime(notification.created_at, locale)}
                              </time>
                            </span>
                            <span className="mt-1.5 block text-xs leading-relaxed text-slate-400">
                              {notification.message}
                            </span>
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
