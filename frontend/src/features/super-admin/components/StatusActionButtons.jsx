const MANAGEABLE_STATUSES = ['active', 'inactive', 'archived']

export default function StatusActionButtons({ currentStatus, onSelect, disabled, labels }) {
  return (
    <div className="flex flex-wrap gap-1">
      {MANAGEABLE_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          className={[
            'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
            currentStatus === status
              ? 'bg-white/10 text-white ring-1 ring-white/20'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
          ].join(' ')}
          disabled={disabled || currentStatus === status}
          onClick={() => onSelect(status)}
        >
          {labels[status]}
        </button>
      ))}
    </div>
  )
}
