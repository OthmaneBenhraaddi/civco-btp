import { useTheme } from '../context/ThemeContext'
import { ROLE_TONE_COLOR_KEYS } from '../theme/themeColorDefaults'
import { buildToneBadgeStyle } from '../utils/colorUtils'

export default function RoleBadge({ label, tone = 'slate', className = '' }) {
  const { colors } = useTheme()
  const colorKey = ROLE_TONE_COLOR_KEYS[tone] ?? 'role_slate'
  const color = colors[colorKey] ?? colors.role_slate

  return (
    <span
      className={[
        'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        className,
      ].join(' ')}
      style={buildToneBadgeStyle(color)}
    >
      {label}
    </span>
  )
}
