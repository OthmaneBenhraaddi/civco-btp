/** @typedef {'monthly' | 'weekly' | 'daily'} TaskInterval */

const MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_LABELS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const WEEKDAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * @param {TaskInterval} interval
 * @param {string} locale
 * @param {{ inProgress: number, completed: number }} totals
 */
export function buildTaskChartSeries(interval, locale, totals) {
  const monthLabels = locale === 'fr' ? MONTH_LABELS_FR : MONTH_LABELS_EN
  const dayLabels = locale === 'fr' ? WEEKDAY_LABELS_FR : WEEKDAY_LABELS_EN
  const inProgressBase = Math.max(totals.inProgress, 1)
  const completedBase = Math.max(totals.completed, 1)

  if (interval === 'monthly') {
    return monthLabels.map((label, index) => {
      const wave = 0.55 + Math.sin((index / 12) * Math.PI * 2) * 0.35
      return {
        label,
        inProgress: Math.round(inProgressBase * wave * (0.7 + index * 0.025)),
        completed: Math.round(completedBase * (0.45 + wave * 0.55)),
      }
    })
  }

  if (interval === 'weekly') {
    return Array.from({ length: 4 }, (_, week) => ({
      label: locale === 'fr' ? `S${week + 1}` : `W${week + 1}`,
      inProgress: Math.round(inProgressBase * (0.65 + week * 0.12)),
      completed: Math.round(completedBase * (0.4 + week * 0.18)),
    }))
  }

  return dayLabels.map((label, index) => ({
    label,
    inProgress: Math.round(inProgressBase * (0.35 + (index % 5) * 0.14)),
    completed: Math.round(completedBase * (0.25 + ((index + 2) % 6) * 0.11)),
  }))
}

/**
 * @param {string} locale
 * @param {{ activitySeries?: Array<{ month: string, revenue: number, chantiers: number }> }} options
 */
export function buildFinancialActivitySeries(locale, { activitySeries = [] } = {}) {
  const monthLabels = locale === 'fr' ? MONTH_LABELS_FR : MONTH_LABELS_EN

  if (activitySeries.length > 0) {
    return activitySeries.map((point) => {
      const monthIndex = Number(point.month?.split('-')[1] ?? 1) - 1

      return {
        label: monthLabels[monthIndex] ?? point.month,
        revenue: Number(point.revenue ?? 0),
        chantiers: Number(point.chantiers ?? 0),
      }
    })
  }

  return monthLabels.slice(0, 10).map((label) => ({
    label,
    revenue: 0,
    chantiers: 0,
  }))
}

/** @param {Record<string, number>} byStatus @param {string[]} palette */
export function buildChantierDistribution(byStatus, palette = []) {
  const entries = Object.entries(byStatus ?? {})
  const defaultPalette = palette.length > 0 ? palette : [
    '#6366f1', '#14b8a6', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b',
  ]

  if (entries.length === 0) {
    return [
      { name: 'planned', value: 4, color: defaultPalette[0] },
      { name: 'in_progress', value: 6, color: defaultPalette[1] },
      { name: 'on_hold', value: 2, color: defaultPalette[3] },
      { name: 'completed', value: 3, color: defaultPalette[4] },
    ]
  }

  return entries.map(([name, value], index) => ({
    name,
    value,
    color: defaultPalette[index % defaultPalette.length],
  }))
}
