const PRIORITE_STYLES = {
  haute: 'border-[rgba(248,113,113,0.4)] bg-[rgba(248,113,113,0.12)] text-red-300',
  moyenne: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[var(--pg-accent)]',
  basse: 'border-[#334155] bg-[#0e121b] text-slate-300',
}

export default function TaskPriorityBadge({ priority, label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${PRIORITE_STYLES[priority] ?? PRIORITE_STYLES.basse}`}
    >
      {label ?? priority}
    </span>
  )
}
