const PRIORITE_STYLES = {
  haute: 'bg-indigo-700 text-indigo-50 ring-1 ring-indigo-500/40',
  moyenne: 'bg-blue-600 text-white',
  basse: 'bg-sky-900/80 text-sky-200 ring-1 ring-sky-700/50',
}

export default function TaskPriorityBadge({ priority, label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITE_STYLES[priority] ?? PRIORITE_STYLES.basse}`}
    >
      {label ?? priority}
    </span>
  )
}
