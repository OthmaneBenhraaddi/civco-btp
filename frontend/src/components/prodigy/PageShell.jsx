import Reveal from './Reveal'

export default function PageShell({
  children,
  eyebrow,
  title,
  subtitle,
  actions,
  wide = false,
  compact = false,
  className = '',
}) {
  return (
    <div
      className={[
        'pg-page mx-auto w-full px-4 sm:px-6',
        compact ? 'py-8' : 'py-10',
        wide ? 'max-w-[1180px]' : 'max-w-[1080px]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(eyebrow || title || actions) && (
        <Reveal
          className={[
            'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
            compact ? 'mb-6' : 'mb-8',
          ].join(' ')}
        >
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--pg-accent)]">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h1 className="pg-section-title">{title}</h1> : null}
            {subtitle ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--pg-text-muted)]">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </Reveal>
      )}
      {children}
    </div>
  )
}
