const STATUT_STYLES = {
  en_cours: 'bg-yellow-500/10 text-yellow-400',
  termine: 'bg-green-500/10 text-green-400',
  bloque: 'bg-red-500/10 text-red-400',
  non_commence: 'bg-slate-500/10 text-slate-400',
}

const BASE_CLASSES = 'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

export default function TaskStatusBadge({ status, label }) {
  const style = STATUT_STYLES[status] ?? 'bg-slate-500/10 text-slate-400'

  return (
    <span className={`${BASE_CLASSES} ${style}`}>
      {label ?? status}
    </span>
  )
}
