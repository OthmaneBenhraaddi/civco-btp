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
import { formatMoney } from '../../../utils/currency'
import { buildFinancialActivitySeries } from '../dashboardChartData'
import {
  CHART_AXIS_TICK,
  CHART_GRID_PROPS,
  CHART_LEGEND_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
  DASHBOARD_CARD_CLASS,
} from '../dashboardTheme'

function formatRevenueAxis(value) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`
  }

  return String(Math.round(value))
}

export default function FinancialActivityBlock({ financial }) {
  const { t, locale } = useTranslation()
  const { colors } = useTheme()

  const chartData = useMemo(
    () => buildFinancialActivitySeries(locale, {
      activitySeries: financial?.activity_series ?? [],
    }),
    [financial?.activity_series, locale],
  )

  return (
    <article className={`p-6 ${DASHBOARD_CARD_CLASS}`}>
      <h2 className="mb-6 text-base font-semibold text-white">{t('dashboard.financialActivity')}</h2>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
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
              yAxisId="revenue"
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={formatRevenueAxis}
            />
            <YAxis
              yAxisId="chantiers"
              orientation="right"
              tick={CHART_AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={36}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              formatter={(value, name) => {
                if (name === t('dashboard.revenueSeries')) {
                  return [formatMoney(value, locale), name]
                }

                return [value, name]
              }}
            />
            <Legend iconType="circle" wrapperStyle={CHART_LEGEND_STYLE} />
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              name={t('dashboard.revenueSeries')}
              stroke={colors.chart_revenue}
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              animationDuration={800}
            />
            <Area
              yAxisId="chantiers"
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
