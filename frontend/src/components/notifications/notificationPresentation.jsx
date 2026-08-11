import {
  Bell,
  Check,
  FileText,
  History,
  MessageSquare,
  Receipt,
  Trash2,
  UserPlus,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react'

const TYPE_ICON_MAP = {
  chat: { Icon: MessageSquare, tone: 'text-sky-400' },
  quote_signed: { Icon: FileText, tone: 'text-emerald-400' },
  invoice_created: { Icon: Receipt, tone: 'text-amber-400' },
  project_alert: { Icon: FolderKanban, tone: 'text-indigo-400' },
  amendment_pending: { Icon: FileText, tone: 'text-amber-400' },
  amendment_resolved: { Icon: CheckCircle2, tone: 'text-emerald-400' },
}

const TITLE_ICON_RULES = [
  { test: /document/i, Icon: FileText, tone: 'text-sky-400' },
  { test: /client/i, Icon: UserPlus, tone: 'text-violet-400' },
  { test: /projet supprim/i, Icon: Trash2, tone: 'text-rose-400' },
  { test: /statut|phase termin|tâche termin/i, Icon: CheckCircle2, tone: 'text-emerald-400' },
  { test: /projet|chantier/i, Icon: FolderKanban, tone: 'text-indigo-400' },
]

export function resolveNotificationIcon(title = '', isActivity = false, type = null) {
  if (isActivity) {
    return { Icon: History, tone: 'text-slate-400' }
  }

  if (type && TYPE_ICON_MAP[type]) {
    return TYPE_ICON_MAP[type]
  }

  const match = TITLE_ICON_RULES.find((rule) => rule.test.test(title))
  return match ?? { Icon: Bell, tone: 'text-slate-400' }
}

/**
 * Highlights French guillemet segments « like this » in the message body.
 */
export function renderHighlightedMessage(message = '') {
  const parts = String(message).split(/(«[^»]+»)/g)

  return parts.map((part, index) => {
    if (part.startsWith('«') && part.endsWith('»')) {
      return (
        <span key={`${part}-${index}`} className="font-medium text-slate-200">
          {part}
        </span>
      )
    }

    return <span key={`${part}-${index}`} className="text-slate-300">{part}</span>
  })
}

export function IconCheck({ className }) {
  return <Check className={className} strokeWidth={2} aria-hidden />
}
