import { useTranslation } from '../i18n/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { STATUS_COLOR_KEYS } from '../theme/themeColorDefaults'
import { buildToneBadgeStyle } from '../utils/colorUtils'

const BASE_CLASSES = 'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset'

export default function StatusBadge({ status }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const label = t(`status.${status}`)
  const colorKey = STATUS_COLOR_KEYS[status] ?? 'neutral_status'
  const color = colors[colorKey] ?? colors.neutral_status

  return (
    <span className={BASE_CLASSES} style={buildToneBadgeStyle(color)}>
      {label === `status.${status}` ? status : label}
    </span>
  )
}
