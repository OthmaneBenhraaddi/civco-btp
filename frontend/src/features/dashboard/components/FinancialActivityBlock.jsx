import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from '../../../i18n/LanguageContext'
import { useTheme } from '../../../context/ThemeContext'
import { buildFinancialActivitySeries } from '../dashboardChartData'
import {
  CHART_AXIS_TICK,
  CHART_GRID_PROPS,
  CHART_LEGEND_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
  DASHBOARD_CARD_CLASS,
} from '../dashboardTheme'

export default function FinancialActivityBlock({ financial }) {
  const { t, locale } = useTranslation()
  const { colors } = useTheme()

  const chartData = useMemo(
    () => buildFinancialActivitySeries(locale, {
      totalRevenue: financial?.total_revenue ?? 0,
      totalExpenses: financial?.total_expenses ?? 0,
    }),
    [financial?.total_expenses, financial?.total_revenue, locale],
  )

  return (
    <article className={`col-span-12 p-6 lg:col-span-8 ${DASHBOARD_CARD_CLASS}`}>
      <h2 className="mb-6 text-base font-semibold text-white">{t('dashboard.financialActivity')}</h2>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.chart_revenue} stopOpacity={0.4} />
                <stop offset="100%" stopColor={colors.chart_revenue} stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="chantierGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.chart_activity} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colors.chart_activity} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid {...CHART_GRID_PROPS} />
            <XAxis
              dataKey="label"
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(value) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            />
            <Legend iconType="circle" wrapperStyle={CHART_LEGEND_STYLE} />
            <Area
              type="monotone"
              dataKey="revenue"
              name={t('dashboard.revenueSeries')}
              stroke={colors.chart_revenue}
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="chantiers"
              name={t('dashboard.chantierSeries')}
              stroke={colors.chart_activity}
              strokeWidth={2.5}
              fill="url(#chantierGradient)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
