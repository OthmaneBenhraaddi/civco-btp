import { useCallback, useState } from 'react'
import KpiCard from '../../components/KpiCard'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { LIVE_SYNC_INTERVAL_MS, useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as dashboardApi from '../../api/dashboard'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatMoneyParts } from '../../utils/currency'
import ChantierDistributionChart from './components/ChantierDistributionChart'
import DailyScheduleFeed from './components/DailyScheduleFeed'
import FinancialActivityBlock from './components/FinancialActivityBlock'
import RecentWorkspaceTable from './components/RecentWorkspaceTable'
import TaskOverviewBlock from './components/TaskOverviewBlock'
import WorkspaceCalendar from './components/WorkspaceCalendar'

export default function DashboardPage() {
  const { t, locale } = useTranslation()
  const { user, company } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSummary = useCallback(async ({ silent = false } = {}) => {
    if (!company?.id) {
      return
    }

    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const data = await dashboardApi.fetchDashboardSummary()
      setSummary(data)
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('dashboard.loadError')))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [company?.id, t])

  useAutoRefresh(fetchSummary, [fetchSummary], LIVE_SYNC_INTERVAL_MS)

  if (loading && !summary) {
    return (
      <div className="dashboard list-page mx-auto max-w-[1600px] p-6">
        <p className="text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div className="dashboard list-page mx-auto max-w-[1600px] p-6">
        <p className="error">{error}</p>
      </div>
    )
  }

  const projects = summary?.projects ?? {}
  const financial = summary?.financial ?? {}
  const recentProjects = summary?.recent_projects ?? []

  const revenueParts = formatMoneyParts(financial.total_revenue, locale)
  const outstandingParts = formatMoneyParts(financial.outstanding_balance, locale)
  const expensesParts = formatMoneyParts(financial.total_expenses, locale)

  return (
    <div className="dashboard list-page mx-auto max-w-[1600px] p-6">
      <header className="dashboard-header mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('dashboard.welcome', { name: user?.full_name ?? t('layout.profileFallbackName') })}
          </p>
        </div>
      </header>

      <section className="kpi-grid grid gap-4">
        <KpiCard
          label={t('dashboard.kpi.totalProjects')}
          value={projects.total ?? 0}
          hint={t('dashboard.kpi.activeProjects', { count: projects.active_count ?? 0 })}
          variant="operational"
        />
        <KpiCard
          label={t('dashboard.kpi.averageProgress')}
          value={`${projects.average_progress ?? 0}%`}
          variant="progress"
        />
        <KpiCard
          label={t('dashboard.kpi.totalRevenue')}
          moneyAmount={revenueParts.amount}
          moneyCurrency={revenueParts.currency}
          variant="financial"
        />
        <KpiCard
          label={t('dashboard.kpi.outstanding')}
          moneyAmount={outstandingParts.amount}
          moneyCurrency={outstandingParts.currency}
          hint={t('dashboard.kpi.overdueInvoices', { count: financial.overdue_invoices_count ?? 0 })}
          variant="warning"
        />
        <KpiCard
          label={t('dashboard.kpi.totalExpenses')}
          moneyAmount={expensesParts.amount}
          moneyCurrency={expensesParts.currency}
          variant="expense"
        />
      </section>

      <div className="mt-6 grid grid-cols-12 gap-6">
        <TaskOverviewBlock />

        <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
          <ChantierDistributionChart byStatus={projects.by_status} />
          <DailyScheduleFeed />
          <WorkspaceCalendar />
        </div>

        <FinancialActivityBlock financial={financial} />

        <RecentWorkspaceTable projects={recentProjects} />
      </div>
    </div>
  )
}
