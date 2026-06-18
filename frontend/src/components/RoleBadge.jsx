const TONE_CLASSES = {
  purple: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
  sky: 'bg-sky-500/10 text-sky-300 ring-sky-500/20',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  slate: 'bg-slate-500/10 text-slate-300 ring-slate-500/20',
}

export default function RoleBadge({ label, tone = 'slate', className = '' }) {
  const toneClass = TONE_CLASSES[tone] ?? TONE_CLASSES.slate

  return (
    <span
      className={[
        'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneClass,
        className,
      ].join(' ')}
    >
      {label}
    </span>
  )
}

export { TONE_CLASSES }
