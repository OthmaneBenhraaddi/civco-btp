import {
  Bell,
  Check,
  CheckCircle2,
  FileText,
  FolderKanban,
  History,
  Trash2,
  UserPlus,
} from 'lucide-react'

const TITLE_ICON_RULES = [
  { test: /document/i, Icon: FileText, tone: 'text-sky-400' },
  { test: /client/i, Icon: UserPlus, tone: 'text-violet-400' },
  { test: /projet supprim/i, Icon: Trash2, tone: 'text-rose-400' },
  { test: /statut|phase termin|tâche termin/i, Icon: CheckCircle2, tone: 'text-emerald-400' },
  { test: /projet|chantier/i, Icon: FolderKanban, tone: 'text-indigo-400' },
]

export function resolveNotificationIcon(title = '', isActivity = false) {
  if (isActivity) {
    return { Icon: History, tone: 'text-slate-400' }
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
