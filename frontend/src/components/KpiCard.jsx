const DOT_COLORS = {
  purple: 'bg-violet-500',
  cyan: 'bg-cyan-400',
  green: 'bg-emerald-500',
  orange: 'bg-amber-500',
  red: 'bg-red-500',
}

const VARIANT_DOT = {
  operational: 'purple',
  progress: 'cyan',
  financial: 'green',
  warning: 'orange',
  expense: 'red',
}

export default function KpiCard({
  label,
  value,
  moneyAmount,
  moneyCurrency,
  hint,
  variant = 'operational',
  dotColor,
}) {
  const dot = DOT_COLORS[dotColor ?? VARIANT_DOT[variant] ?? 'purple']
  const isMoney = moneyAmount !== undefined && moneyAmount !== null

  return (
    <article className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#1f2937] p-5 shadow-lg">
      <span
        className={`absolute right-5 top-5 h-2 w-2 rounded-full ${dot}`}
        aria-hidden
      />

      <p className="pr-4 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>

      {isMoney ? (
        <p className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-1.5 leading-tight">
          <span className="text-xl font-extrabold tracking-tight text-white">{moneyAmount}</span>
          {moneyCurrency ? (
            <span className="text-xs font-semibold uppercase text-slate-400">{moneyCurrency}</span>
          ) : null}
        </p>
      ) : (
        <p className="mt-2 text-xl font-extrabold tracking-tight text-white">{value}</p>
      )}

      {hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </article>
  )
}
