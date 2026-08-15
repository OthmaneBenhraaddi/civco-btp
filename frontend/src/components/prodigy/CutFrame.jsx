/**
 * Chamfered (chopped-corner) frame — the core Prodigy surface primitive.
 * Outer shell paints the border color; inner fill holds content.
 */
export default function CutFrame({
  children,
  className = '',
  innerClassName = '',
  size = 'md',
  accent = false,
  as: Tag = 'div',
  ...rest
}) {
  return (
    <Tag
      {...rest}
      className={[
        'pg-cut-shell',
        `pg-cut-shell--${size}`,
        accent ? 'is-accent' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={['pg-cut-shell__inner', innerClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </Tag>
  )
}
