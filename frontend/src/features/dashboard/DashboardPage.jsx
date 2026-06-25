import { useCallback, useMemo, useState } from 'react'
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
import DashboardWidgetShell from './DashboardWidgetShell'
import {
  readDashboardLayout,
  reorderDashboardLayout,
  saveDashboardLayout,
} from './dashboardLayoutStore'

export default function DashboardPage() {
  const { t, locale } = useTranslation()
  const { user, company, isAdmin } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [layoutOrder, setLayoutOrder] = useState(() => readDashboardLayout())
  const [draftOrder, setDraftOrder] = useState(() => readDashboardLayout())
  const [draggingId, setDraggingId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)

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

  const activeOrder = editMode ? draftOrder : layoutOrder

  function enterEditMode() {
    setDraftOrder(layoutOrder)
    setEditMode(true)
  }

  function cancelEditMode() {
    setDraftOrder(layoutOrder)
    setDraggingId(null)
    setDropTargetId(null)
    setEditMode(false)
  }

  function handleSaveLayout() {
    const saved = saveDashboardLayout(draftOrder)
    setLayoutOrder(saved)
    setDraftOrder(saved)
    setDraggingId(null)
    setDropTargetId(null)
    setEditMode(false)
  }

  function handleDragStart(widgetId) {
    setDraggingId(widgetId)
  }

  function handleDragOver(event, widgetId) {
    event.preventDefault()
    if (draggingId && draggingId !== widgetId) {
      setDropTargetId(widgetId)
    }
  }

  function handleDrop(event, widgetId) {
    event.preventDefault()
    if (!draggingId) {
      return
    }

    setDraftOrder((current) => reorderDashboardLayout(current, draggingId, widgetId))
    setDraggingId(null)
    setDropTargetId(null)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDropTargetId(null)
  }

  const widgetRenderers = useMemo(() => {
    if (!summary) {
      return {}
    }

    const projects = summary.projects ?? {}
    const financial = summary.financial ?? {}
    const recentProjects = summary.recent_projects ?? []
    const revenueParts = formatMoneyParts(financial.total_revenue, locale)
    const outstandingParts = formatMoneyParts(financial.outstanding_balance, locale)
    const expensesParts = formatMoneyParts(financial.total_expenses, locale)

    return {
      kpis: (
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
      ),
      taskOverview: <TaskOverviewBlock />,
      chantierDistribution: <ChantierDistributionChart byStatus={projects.by_status} />,
      dailySchedule: <DailyScheduleFeed />,
      workspaceCalendar: <WorkspaceCalendar />,
      financialActivity: <FinancialActivityBlock financial={financial} />,
      recentProjects: <RecentWorkspaceTable projects={recentProjects} />,
    }
  }, [summary, locale, t])

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

  return (
    <div className={`dashboard list-page mx-auto max-w-[1600px] p-6 ${editMode ? 'dashboard--edit-mode' : ''}`}>
      <header className="dashboard-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {t('dashboard.welcome', { name: user?.full_name ?? t('layout.profileFallbackName') })}
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            {editMode ? (
              <>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                  {t('dashboard.editModeActive')}
                </span>
                <button type="button" className="ghost" onClick={cancelEditMode}>
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={handleSaveLayout}>
                  {t('dashboard.saveLayout')}
                </button>
              </>
            ) : (
              <button type="button" className="filter-select" onClick={enterEditMode}>
                {t('dashboard.editMode')}
              </button>
            )}
          </div>
        ) : null}
      </header>

      <div className="grid grid-cols-12 gap-6">
        {activeOrder.map((widgetId) => {
          const content = widgetRenderers[widgetId]
          if (!content) {
            return null
          }

          return (
            <DashboardWidgetShell
              key={widgetId}
              widgetId={widgetId}
              editMode={editMode}
              isDragging={draggingId === widgetId}
              isDropTarget={dropTargetId === widgetId}
              onDragStart={() => handleDragStart(widgetId)}
              onDragOver={(event) => handleDragOver(event, widgetId)}
              onDragLeave={() => setDropTargetId(null)}
              onDrop={(event) => handleDrop(event, widgetId)}
              onDragEnd={handleDragEnd}
            >
              {content}
            </DashboardWidgetShell>
          )
        })}
      </div>
    </div>
  )
}
