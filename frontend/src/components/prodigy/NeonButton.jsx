import { Link } from 'react-router-dom'

/**
 * Chamfered CTA — neon (green edge) or ghost (slate edge).
 */
export default function NeonButton({
  children,
  to,
  href,
  onClick,
  variant = 'neon',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
}) {
  const shellClass = [
    'pg-cut-btn',
    variant === 'neon' ? 'is-neon' : variant === 'danger' ? 'is-danger' : 'is-ghost',
    size === 'sm' ? 'is-compact' : '',
    disabled ? 'is-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const face = <span className="pg-cut-btn__face whitespace-nowrap">{children}</span>

  if (to) {
    return (
      <Link to={to} className={shellClass} onClick={onClick} aria-disabled={disabled}>
        {face}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={shellClass} onClick={onClick}>
        {face}
      </a>
    )
  }

  return (
    <button type={type} className={shellClass} onClick={onClick} disabled={disabled}>
      {face}
    </button>
  )
}
