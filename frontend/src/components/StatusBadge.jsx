import { useTranslation } from '../i18n/LanguageContext'

const STATUS_STYLES = {
  paid: 'bg-green-500/10 text-green-400',
  completed: 'bg-green-500/10 text-green-400',
  done: 'bg-green-500/10 text-green-400',
  accepted: 'bg-blue-500/10 text-blue-400',
  sent: 'bg-blue-500/10 text-blue-400',
  in_progress: 'bg-sky-500/10 text-sky-400',
  planned: 'bg-sky-500/10 text-sky-400',
  partially_paid: 'bg-yellow-500/10 text-yellow-400',
  on_hold: 'bg-yellow-500/10 text-yellow-400',
  blocked: 'bg-yellow-500/10 text-yellow-400',
  expired: 'bg-yellow-500/10 text-yellow-400',
  overdue: 'bg-red-500/10 text-red-400',
  cancelled: 'bg-red-500/10 text-red-400',
  rejected: 'bg-red-500/10 text-red-400',
  draft: 'bg-slate-500/10 text-slate-400',
  todo: 'bg-slate-500/10 text-slate-400',
}

const BASE_CLASSES = 'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const label = t(`status.${status}`)
  const style = STATUS_STYLES[status] ?? 'bg-slate-500/10 text-slate-400'

  return (
    <span className={`${BASE_CLASSES} ${style}`}>
      {label === `status.${status}` ? status : label}
    </span>
  )
}
