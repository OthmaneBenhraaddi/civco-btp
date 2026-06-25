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
 * @param {{ totalRevenue: number, totalExpenses: number }} financial
 */
export function buildFinancialActivitySeries(locale, financial) {
  const monthLabels = locale === 'fr' ? MONTH_LABELS_FR : MONTH_LABELS_EN
  const revenueBase = Math.max(financial.totalRevenue, 120000)
  const expenseBase = Math.max(financial.totalExpenses, 45000)

  return monthLabels.slice(0, 10).map((label, index) => {
    const progress = index / 9
    return {
      label,
      revenue: Math.round(revenueBase * (0.35 + progress * 0.65) * (0.92 + Math.sin(index) * 0.08)),
      chantiers: Math.round(expenseBase * (0.4 + progress * 0.55) * (0.88 + Math.cos(index * 1.2) * 0.1)),
    }
  })
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

export const DAILY_SCHEDULE_EVENTS = [
  {
    id: 'evt-1',
    time: '08:30',
    titleKey: 'dashboard.schedule.coordination',
    tagKey: 'dashboard.schedule.tags.chantier',
    tagColor: 'bg-teal-500/20 text-teal-300',
  },
  {
    id: 'evt-2',
    time: '10:15',
    titleKey: 'dashboard.schedule.architect',
    tagKey: 'dashboard.schedule.tags.validation',
    tagColor: 'bg-violet-500/20 text-violet-300',
  },
  {
    id: 'evt-3',
    time: '14:00',
    titleKey: 'dashboard.schedule.siteVisit',
    tagKey: 'dashboard.schedule.tags.inspection',
    tagColor: 'bg-blue-500/20 text-blue-300',
  },
  {
    id: 'evt-4',
    time: '16:45',
    titleKey: 'dashboard.schedule.invoice',
    tagKey: 'dashboard.schedule.tags.finance',
    tagColor: 'bg-amber-500/20 text-amber-300',
  },
]
