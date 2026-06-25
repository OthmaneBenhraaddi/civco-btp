export const THEME_COLOR_DEFAULTS = {
  primary_color: '#2563EB',
  success_status: '#4ADE80',
  info_status: '#60A5FA',
  progress_status: '#38BDF8',
  warning_status: '#FACC15',
  danger_status: '#F87171',
  neutral_status: '#94A3B8',
  accent_status: '#34D399',
  violet_status: '#A78BFA',
  role_purple: '#C4B5FD',
  role_sky: '#7DD3FC',
  role_amber: '#FCD34D',
  role_emerald: '#6EE7B7',
  role_slate: '#CBD5E1',
  chart_revenue: '#6366F1',
  chart_activity: '#14B8A6',
  chart_in_progress: '#14B8A6',
  chart_completed: '#8B5CF6',
  chart_palette_1: '#6366F1',
  chart_palette_2: '#14B8A6',
  chart_palette_3: '#3B82F6',
  chart_palette_4: '#F59E0B',
  chart_palette_5: '#8B5CF6',
  chart_palette_6: '#EC4899',
  chart_palette_7: '#64748B',
}

export const THEME_COLOR_GROUPS = [
  {
    id: 'brand',
    labelKey: 'theme.groups.brand',
    keys: ['primary_color'],
  },
  {
    id: 'status',
    labelKey: 'theme.groups.status',
    keys: [
      'success_status',
      'info_status',
      'progress_status',
      'warning_status',
      'danger_status',
      'neutral_status',
      'accent_status',
      'violet_status',
    ],
  },
  {
    id: 'roles',
    labelKey: 'theme.groups.roles',
    keys: ['role_purple', 'role_sky', 'role_amber', 'role_emerald', 'role_slate'],
  },
  {
    id: 'charts',
    labelKey: 'theme.groups.charts',
    keys: [
      'chart_revenue',
      'chart_activity',
      'chart_in_progress',
      'chart_completed',
      'chart_palette_1',
      'chart_palette_2',
      'chart_palette_3',
      'chart_palette_4',
      'chart_palette_5',
      'chart_palette_6',
      'chart_palette_7',
    ],
  },
]

export const STATUS_COLOR_KEYS = {
  paid: 'success_status',
  completed: 'success_status',
  done: 'success_status',
  signed: 'accent_status',
  accepted: 'info_status',
  sent: 'info_status',
  invoiced: 'violet_status',
  in_progress: 'progress_status',
  planned: 'progress_status',
  partially_paid: 'warning_status',
  on_hold: 'warning_status',
  blocked: 'warning_status',
  expired: 'warning_status',
  overdue: 'danger_status',
  cancelled: 'danger_status',
  rejected: 'danger_status',
  draft: 'neutral_status',
  todo: 'neutral_status',
}

export const ROLE_TONE_COLOR_KEYS = {
  purple: 'role_purple',
  sky: 'role_sky',
  amber: 'role_amber',
  emerald: 'role_emerald',
  slate: 'role_slate',
}

export function getChartPalette(colors) {
  return [
    colors.chart_palette_1,
    colors.chart_palette_2,
    colors.chart_palette_3,
    colors.chart_palette_4,
    colors.chart_palette_5,
    colors.chart_palette_6,
    colors.chart_palette_7,
  ].filter(Boolean)
}
