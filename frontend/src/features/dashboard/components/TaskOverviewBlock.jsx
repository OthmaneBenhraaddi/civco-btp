import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTranslation } from '../../../i18n/LanguageContext'
import * as workspaceTasksApi from '../../../api/workspaceTasks'
import { buildTaskChartSeries } from '../dashboardChartData'
import {
  CHART_AXIS_TICK,
  CHART_GRID_PROPS,
  CHART_LEGEND_STYLE,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
  DASHBOARD_CARD_CLASS,
  INTERVAL_CAPSULE_CLASS,
  intervalTabClass,
} from '../dashboardTheme'

const INTERVALS = ['monthly', 'weekly', 'daily']

export default function TaskOverviewBlock() {
  const { t, locale } = useTranslation()
  const [interval, setInterval] = useState('monthly')
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    workspaceTasksApi.fetchWorkspaceTasks()
      .then(setTasks)
      .catch(() => setTasks([]))
  }, [])

  const { totalTasks, chartData } = useMemo(() => {
    const inProgressCount = tasks.filter((task) => task.statut === 'en_cours' || task.statut === 'bloque').length
    const completedCount = tasks.filter((task) => task.statut === 'termine').length
    const totals = { inProgress: inProgressCount, completed: completedCount }

    return {
      totalTasks: tasks.length,
      chartData: buildTaskChartSeries(interval, locale, totals),
    }
  }, [interval, locale, tasks])

  return (
    <article className={`col-span-12 p-6 lg:col-span-8 ${DASHBOARD_CARD_CLASS}`}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{t('dashboard.taskTracking')}</h2>
          <p className="mt-1 text-2xl font-black tracking-tight text-white">
            {t('dashboard.totalTasks', { count: totalTasks })}
          </p>
        </div>

        <div
          className={INTERVAL_CAPSULE_CLASS}
          role="group"
          aria-label={t('dashboard.intervalLabel')}
        >
          {INTERVALS.map((key) => {
            const isActive = interval === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setInterval(key)}
                className={intervalTabClass(isActive)}
              >
                {t(`dashboard.interval.${key}`)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} barCategoryGap="18%" margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
              width={36}
            />
            <Tooltip
              cursor={{ fill: 'rgba(55, 65, 81, 0.25)' }}
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={CHART_TOOLTIP_LABEL_STYLE}
            />
            <Legend iconType="circle" wrapperStyle={CHART_LEGEND_STYLE} />
            <Bar
              dataKey="inProgress"
              name={t('dashboard.inProgress')}
              fill="#14b8a6"
              radius={[6, 6, 0, 0]}
              animationDuration={650}
            />
            <Bar
              dataKey="completed"
              name={t('dashboard.completed')}
              fill="#8b5cf6"
              radius={[6, 6, 0, 0]}
              animationDuration={650}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}
