import { BENTO_CARD_CLASS } from '../theme/designTokens'

const DOT_COLORS = {
  purple: 'bg-indigo-400',
  cyan: 'bg-sky-400',
  green: 'bg-emerald-400',
  orange: 'bg-amber-400',
  red: 'bg-rose-400',
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
    <article
      className={`relative min-w-0 overflow-hidden ${BENTO_CARD_CLASS} bg-[#121316] p-5 transition-colors duration-200 hover:bg-[#16171b]`}
    >
      <span
        className={`absolute right-5 top-5 h-1.5 w-1.5 rounded-full ${dot}`}
        aria-hidden
      />

      <p className="pr-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>

      {isMoney ? (
        <p className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-1.5 leading-tight">
          <span className="text-2xl font-semibold tracking-tight text-white">{moneyAmount}</span>
          {moneyCurrency ? (
            <span className="text-[11px] font-medium uppercase text-slate-500">{moneyCurrency}</span>
          ) : null}
        </p>
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
      )}

      {hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </article>
  )
}
