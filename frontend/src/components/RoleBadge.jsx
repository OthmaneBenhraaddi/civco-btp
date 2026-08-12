const TONE_CLASSES = {
  purple: 'border-[rgba(34,197,94,0.35)] bg-[rgba(34,197,94,0.12)] text-[var(--pg-accent)]',
  sky: 'border-[rgba(56,189,248,0.35)] bg-[rgba(56,189,248,0.1)] text-sky-300',
  amber: 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] text-amber-300',
  emerald: 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
  slate: 'border-[#334155] bg-[#0e121b] text-slate-300',
}

export default function RoleBadge({ label, tone = 'slate', className = '' }) {
  const toneClass = TONE_CLASSES[tone] ?? TONE_CLASSES.slate

  return (
    <span
      className={[
        'inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]',
        toneClass,
        className,
      ].join(' ')}
    >
      {label}
    </span>
  )
}

export { TONE_CLASSES }
