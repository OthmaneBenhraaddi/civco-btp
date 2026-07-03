import { formatRelativeTime } from '../../utils/formatRelativeTime'
import {
  IconCheck,
  renderHighlightedMessage,
  resolveNotificationIcon,
} from './notificationPresentation'

export default function NotificationDropdownItem({
  title,
  message,
  createdAt,
  locale,
  type = null,
  isUnread = true,
  isActivity = false,
  isMarking = false,
  onMarkRead,
  onOpen,
  markReadLabel,
  meta,
}) {
  const { Icon, tone } = resolveNotificationIcon(title, isActivity, type)

  return (
    <div
      className={[
        'group relative mx-3 mb-2 flex gap-3 rounded-xl border p-3 transition-colors duration-200',
        isActivity
          ? 'border-white/[0.06] bg-[#16171b] hover:bg-[#1c1d22]'
          : 'border-l-2 border-l-indigo-500/40 border-white/[0.06] bg-[#16171b] hover:bg-[#1c1d22]',
        isMarking ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div
        className={[
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          'bg-slate-800/60 ring-1 ring-white/[0.04]',
        ].join(' ')}
      >
        <Icon className={`h-4 w-4 ${tone}`} strokeWidth={1.75} />
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="notification-item-action min-w-0 flex-1 p-0 text-left text-slate-300 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {isUnread && !isActivity ? (
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400/70 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
              </span>
            ) : null}
            <h4
              className={[
                'truncate text-[13px] leading-snug tracking-tight text-white',
                isUnread && !isActivity ? 'font-semibold' : 'font-medium',
              ].join(' ')}
            >
              {title}
            </h4>
          </div>

          <time
            dateTime={createdAt}
            className="shrink-0 pt-0.5 text-[11px] font-medium tabular-nums text-slate-400"
          >
            {formatRelativeTime(createdAt, locale)}
          </time>
        </div>

        {message ? (
          <p className="mt-2 pr-6 text-[12px] leading-relaxed text-slate-300">
            {renderHighlightedMessage(message)}
          </p>
        ) : null}

        {meta ? (
          <p className="mt-1.5 text-[11px] font-medium text-slate-500">{meta}</p>
        ) : null}
      </button>

      {!isActivity && onMarkRead ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onMarkRead()
          }}
          disabled={isMarking}
          aria-label={markReadLabel}
          className={[
            'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md',
            'text-slate-500 opacity-0 transition-all duration-200',
            'hover:bg-slate-800/80 hover:text-white',
            'group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
          ].join(' ')}
        >
          <IconCheck className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}
