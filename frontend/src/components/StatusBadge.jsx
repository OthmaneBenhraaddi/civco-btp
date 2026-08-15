import { useTranslation } from '../i18n/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { STATUS_COLOR_KEYS } from '../theme/themeColorDefaults'
import { buildToneBadgeStyle } from '../utils/colorUtils'

const BASE_CLASSES =
  'inline-flex w-fit max-w-none items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]'

export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const label = t(`status.${status}`)
  const colorKey = STATUS_COLOR_KEYS[status] ?? 'neutral_status'
  const color = colors[colorKey] ?? colors.neutral_status

  return (
    <span className={BASE_CLASSES} style={buildToneBadgeStyle(color)}>
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label === `status.${status}` ? status : label}
    </span>
  )
}
