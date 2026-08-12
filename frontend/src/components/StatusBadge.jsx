import { useTranslation } from '../i18n/LanguageContext'

const STATUS_STYLES = {
  paid: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
  completed: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
  done: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
  accepted: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[var(--pg-accent)]',
  sent: 'border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.1)] text-sky-300',
  in_progress: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[var(--pg-accent)]',
  planned: 'border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.1)] text-sky-300',
  partially_paid: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] text-amber-300',
  on_hold: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] text-amber-300',
  blocked: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] text-amber-300',
  expired: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] text-amber-300',
  overdue: 'border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-red-300',
  cancelled: 'border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-red-300',
  rejected: 'border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-red-300',
  draft: 'border-[#334155] bg-[#0e121b] text-slate-400',
  todo: 'border-[#334155] bg-[#0e121b] text-slate-400',
}

const BASE_CLASSES =
  'inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]'

export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const label = t(`status.${status}`)
  const style = STATUS_STYLES[status] ?? 'border-[#334155] bg-[#0e121b] text-slate-400'

  return (
    <span className={`${BASE_CLASSES} ${style}`}>
      {label === `status.${status}` ? status : label}
    </span>
  )
}
