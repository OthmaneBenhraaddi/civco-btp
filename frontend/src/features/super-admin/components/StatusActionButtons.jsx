const MANAGEABLE_STATUSES = ['active', 'inactive', 'archived']

const STATUS_TONES = {
  active: {
    selected: 'border-green-500/30 bg-green-500/10 text-green-400 shadow-sm shadow-green-500/10',
    idle: 'text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300',
  },
  inactive: {
    selected: 'border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/10',
    idle: 'text-slate-400 hover:bg-amber-500/10 hover:text-amber-200',
  },
  archived: {
    selected: 'border-slate-500/40 bg-slate-700/50 text-slate-300 shadow-sm shadow-black/20',
    idle: 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200',
  },
}

export default function StatusActionButtons({ currentStatus, onSelect, disabled, labels }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-900/80 p-1">
      {MANAGEABLE_STATUSES.map((status) => {
        const selected = currentStatus === status
        const tone = STATUS_TONES[status]

        return (
          <button
            key={status}
            type="button"
            className={[
              'rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-all duration-200',
              selected
                ? `border ${tone.selected}`
                : `border border-transparent ${tone.idle}`,
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
