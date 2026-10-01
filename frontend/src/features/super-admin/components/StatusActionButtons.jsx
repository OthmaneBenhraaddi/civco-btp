const MANAGEABLE_STATUSES = ['active', 'inactive', 'archived']

const STATUS_TONES = {
  active: {
    selected: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    idle: 'border-transparent text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400',
  },
  inactive: {
    selected: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    idle: 'border-transparent text-slate-400 hover:bg-amber-500/10 hover:text-amber-400',
  },
  archived: {
    selected: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    idle: 'border-transparent text-slate-400 hover:bg-rose-500/10 hover:text-rose-400',
  },
}

export default function StatusActionButtons({ currentStatus, onSelect, disabled, labels }) {
  return (
    <div
      role="radiogroup"
      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/90 p-1"
    >
      {MANAGEABLE_STATUSES.map((status) => {
        const selected = currentStatus === status
        const tone = STATUS_TONES[status]

        return (
          <button
            key={status}
            type="button"
            role="radio"
            aria-checked={selected}
            className={[
              'rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap border transition-all duration-200',
              selected ? tone.selected : tone.idle,
            ].join(' ')}
            disabled={disabled || selected}
            onClick={() => onSelect(status)}
          >
            {labels[status]}
          </button>
        )
      })}
    </div>
  )
}
