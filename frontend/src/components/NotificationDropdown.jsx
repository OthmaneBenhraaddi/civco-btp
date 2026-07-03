import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import * as activityLogsApi from '../api/activityLogs'
import * as notificationsApi from '../api/notifications'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { resolveNavPath } from '../routes/routeAccess'
import NotificationDropdownItem from './notifications/NotificationDropdownItem'

const BELL_PREVIEW_LIMIT = 8
const BELL_POLL_MS = 12000

export default function NotificationDropdown() {
  const { t, locale } = useTranslation()
  const navigate = useNavigate()
  const { user, isAdmin, isClientPortalUser } = useAuth()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [activityItems, setActivityItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [markingId, setMarkingId] = useState(null)
  const [markingAll, setMarkingAll] = useState(false)

  const showActivityFeed = isAdmin && !isClientPortalUser

  const loadNotifications = useCallback(async () => {
    if (!user) {
      return
    }

    setLoading(true)

    try {
      const notificationsResult = await notificationsApi.fetchUnreadNotifications({
        limit: BELL_PREVIEW_LIMIT,
      })

      setItems(notificationsResult.items)
      setUnreadCount(notificationsResult.unreadCount)

      if (showActivityFeed) {
        const activityResult = await activityLogsApi.fetchActivityLogs({ per_page: BELL_PREVIEW_LIMIT })
        setActivityItems(activityResult.items ?? [])
      } else {
        setActivityItems([])
      }
    } catch {
      setItems([])
      setActivityItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [showActivityFeed, user])

  useAutoRefresh(
    () => loadNotifications(),
    [loadNotifications],
    { intervalMs: BELL_POLL_MS, runOnMount: Boolean(user) },
  )

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

  async function handleMarkRead(notificationId) {
    if (markingId === notificationId) {
      return
    }

    setMarkingId(notificationId)

    try {
      const { unreadCount: count } = await notificationsApi.markNotificationAsRead(notificationId)
      setItems((current) => current.filter((item) => item.id !== notificationId))
      setUnreadCount(count)
    } catch {
    } finally {
      setMarkingId(null)
    }
  }

  async function handleOpenNotification(notification) {
    await handleMarkRead(notification.id)
    setOpen(false)

    if (notification.action_path) {
      navigate(resolveNavPath(notification.action_path, user))
    }
  }

  async function handleMarkAllRead() {
    if (markingAll || unreadCount === 0) {
      return
    }

    setMarkingAll(true)

    try {
      await notificationsApi.markAllNotificationsAsRead()
      setItems([])
      setUnreadCount(0)
    } catch {
    } finally {
      setMarkingAll(false)
    }
  }

  function handleActivityClick() {
    setOpen(false)
    navigate(resolveNavPath('/history', user))
  }

  function activityTitle(entry) {
    if (entry.action_type) {
      return t(`history.actionTypes.${entry.action_type}`)
    }

    return t('notifications.activityFallback')
  }

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)
  const hasAlerts = items.length > 0
  const hasActivity = showActivityFeed && activityItems.length > 0
  const showEmptyState = !loading && !hasAlerts && !hasActivity

  if (!user) {
    return null
  }

  return (
    <div ref={rootRef} className="relative flex h-full items-center">
      <button
        type="button"
        aria-label={t('layout.notifications')}
        aria-expanded={open}
        aria-controls="notification-dropdown-panel"
        onClick={toggleOpen}
        className={[
          'app-header-icon-btn relative rounded-lg p-2 transition-colors duration-200',
          open ? 'bg-white/[0.05] text-slate-200' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200',
        ].join(' ')}
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount > 0 ? (
          <span
            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-semibold leading-none text-white ring-2 ring-slate-900"
            aria-label={t('notifications.unreadCount', { count: unreadCount })}
          >
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id="notification-dropdown-panel"
          className={[
            'notification-dropdown-panel absolute right-0 top-full z-50 mt-3 w-[min(24rem,calc(100vw-2rem))] overflow-hidden',
            'rounded-2xl border border-white/[0.08] bg-[#121316] shadow-2xl shadow-black/60',
          ].join(' ')}
        >
          <div className="border-b border-slate-800/60 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-tight text-white">
                  {t('notifications.title')}
                </p>
                <p className="notification-dropdown-subtitle mt-1 text-xs text-slate-400">
                  {unreadCount > 0
                    ? t('notifications.subtitleUnread', { count: unreadCount })
                    : hasActivity
                      ? t('notifications.subtitleActivity')
                      : t('notifications.subtitleEmpty')}
                </p>
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="mark-all-read-btn shrink-0 text-[11px] font-medium text-slate-400 transition-colors hover:text-white disabled:opacity-50"
                >
                  {t('notifications.markAllRead')}
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[min(26rem,58vh)] overflow-y-auto overscroll-contain custom-scrollbar">
            {loading && !hasAlerts && !hasActivity ? (
              <p className="px-5 py-12 text-center text-xs text-slate-500">{t('notifications.loading')}</p>
            ) : null}

            {showEmptyState ? (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/60 ring-1 ring-white/[0.05]">
                  <Bell className="h-4 w-4 text-slate-500" strokeWidth={1.75} />
                </div>
                <p className="text-sm font-medium text-slate-300">{t('notifications.emptyTitle')}</p>
                <p className="mx-auto mt-2 max-w-[16rem] text-xs leading-relaxed text-slate-500">
                  {t('notifications.emptyBody')}
                </p>
              </div>
            ) : null}

            {hasAlerts ? (
              <section>
                <p className="px-5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {t('notifications.alertsSection')}
                </p>
                <ul className="m-0 list-none p-0 pt-1">
                  {items.map((notification) => (
                    <li key={notification.id} className="m-0 list-none p-0">
                      <NotificationDropdownItem
                        title={notification.title}
                        message={notification.message}
                        type={notification.type}
                        createdAt={notification.created_at}
                        locale={locale}
                        isUnread
                        isMarking={markingId === notification.id}
                        markReadLabel={t('notifications.markRead')}
                        onMarkRead={() => handleMarkRead(notification.id)}
                        onOpen={() => handleOpenNotification(notification)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {hasActivity ? (
              <section>
                <p className="px-5 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {t('notifications.activitySection')}
                </p>
                <ul className="m-0 list-none p-0 pt-1">
                  {activityItems.map((entry) => (
                    <li key={entry.id} className="m-0 list-none p-0">
                      <NotificationDropdownItem
                        title={activityTitle(entry)}
                        message={entry.message ?? entry.description}
                        meta={entry.actor}
                        createdAt={entry.created_at ?? entry.timestamp}
                        locale={locale}
                        isUnread={false}
                        isActivity
                        onOpen={handleActivityClick}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {showActivityFeed ? (
            <div className="border-t border-slate-800/60 px-5 py-3.5">
              <Link
                to={resolveNavPath('/history', user)}
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-medium text-slate-400 transition-colors duration-200 hover:text-white"
              >
                {t('notifications.viewAllHistory')}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
