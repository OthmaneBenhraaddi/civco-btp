const STATUT_STYLES = {
  en_cours: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] text-amber-300',
  termine: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
  bloque: 'border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.1)] text-red-300',
  non_commence: 'border-[#334155] bg-[#0e121b] text-slate-400',
}

const BASE_CLASSES =
  'inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]'

export default function TaskStatusBadge({ status, label }) {
  const style = STATUT_STYLES[status] ?? 'border-[#334155] bg-[#0e121b] text-slate-400'

  return (
    <span className={`${BASE_CLASSES} ${style}`}>
      {label ?? status}
    </span>
  )
}
