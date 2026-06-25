import { hexToRgba } from '../utils/colorUtils'

export { hexToRgba }

export default function ClientBadge({ name, color = '#64748B', className = '' }) {
  return (
    <span
      className={[
        'inline-flex w-fit items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        className,
      ].join(' ')}
      style={{
        backgroundColor: hexToRgba(color, 0.15),
        color,
        borderColor: hexToRgba(color, 0.35),
      }}
    >
      {name}
    </span>
  )
}

export function ClientBadgeList({ badges = [], className = '' }) {
  if (!badges.length) {
    return null
  }

  return (
    <span className={['inline-flex flex-wrap items-center gap-1', className].join(' ')}>
      {badges.map((badge) => (
        <ClientBadge key={badge.id} name={badge.name} color={badge.color} />
      ))}
    </span>
  )
}
