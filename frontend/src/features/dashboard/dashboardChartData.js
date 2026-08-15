/** @typedef {'monthly' | 'weekly' | 'daily'} TaskInterval */

const MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const WEEKDAY_LABELS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

/**
 * @param {TaskInterval} interval
 * @param {{ inProgress: number, completed: number }} totals
 */
export function buildTaskChartSeries(interval, totals) {
  const inProgressBase = Math.max(totals.inProgress, 1)
  const completedBase = Math.max(totals.completed, 1)

  if (interval === 'monthly') {
    return MONTH_LABELS_FR.map((label, index) => {
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
      label: `S${week + 1}`,
      inProgress: Math.round(inProgressBase * (0.65 + week * 0.12)),
      completed: Math.round(completedBase * (0.4 + week * 0.18)),
    }))
  }

  return WEEKDAY_LABELS_FR.map((label, index) => ({
    label,
    inProgress: Math.round(inProgressBase * (0.35 + (index % 5) * 0.14)),
    completed: Math.round(completedBase * (0.25 + ((index + 2) % 6) * 0.11)),
  }))
}

/**
 * @param {{ activitySeries?: Array<{ month: string, revenue: number, chantiers: number }> }} options
 */
export function buildFinancialActivitySeries({ activitySeries = [] } = {}) {
  if (activitySeries.length > 0) {
    return activitySeries.map((point) => {
      const monthIndex = Number(point.month?.split('-')[1] ?? 1) - 1

      return {
        label: MONTH_LABELS_FR[monthIndex] ?? point.month,
        revenue: Number(point.revenue ?? 0),
        chantiers: Number(point.chantiers ?? 0),
      }
    })
  }

  return MONTH_LABELS_FR.slice(0, 10).map((label) => ({
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
