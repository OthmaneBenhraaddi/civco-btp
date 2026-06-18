import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from '../../../i18n/LanguageContext'
import { buildChantierDistribution } from '../dashboardChartData'
import {
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
  DASHBOARD_CARD_CLASS,
} from '../dashboardTheme'

export default function ChantierDistributionChart({ byStatus }) {
  const { t } = useTranslation()

  const segments = useMemo(() => buildChantierDistribution(byStatus), [byStatus])
  const total = segments.reduce((sum, item) => sum + item.value, 0)

  return (
    <article className={`p-5 ${DASHBOARD_CARD_CLASS}`}>
      <h3 className="mb-4 text-sm font-semibold text-white">{t('dashboard.chantierDistribution')}</h3>

      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              animationDuration={700}
            >
              {segments.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
              formatter={(value, _name, props) => {
                const label = t(`status.${props.payload.name}`)
                return [value, label === `status.${props.payload.name}` ? props.payload.name : label]
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black tracking-tight text-white">{total}</span>
          <span className="text-[11px] font-medium text-gray-400">{t('dashboard.chantiersTotal')}</span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {segments.map((segment) => {
          const label = t(`status.${segment.name}`)
          return (
            <li key={segment.name} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-gray-400">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden
                />
                {label === `status.${segment.name}` ? segment.name : label}
              </span>
              <span className="font-semibold tabular-nums text-white">{segment.value}</span>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
