import { useCallback, useMemo, useState } from 'react'
import { useDragAutoScroll } from '../../hooks/useDragAutoScroll'
import KpiCard from '../../components/KpiCard'
import NeonButton from '../../components/prodigy/NeonButton'
import { BENTO_CARD_CLASS } from '../../theme/designTokens'
import { useAuth } from '../../context/AuthContext'
import { useStealthModeRefresh } from '../../context/StealthModeContext'
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
  packDashboardLayout,
  readDashboardLayout,
  reorderDashboardLayout,
  saveDashboardLayout,
} from './dashboardLayoutStore'
import {
  canViewFinancialKpis,
  canViewOperationalKpis,
  filterDashboardLayout,
} from './dashboardWidgetAccess'
import { DASHBOARD_COC_CLASS, DASHBOARD_COC_ENABLED } from './dashboardTheme'
import './dashboardCoc.css'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user, company, isAdmin, hasPermission } = useAuth()
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

  useStealthModeRefresh(() => {
    fetchSummary({ silent: true })
  })

  const activeOrder = editMode ? draftOrder : layoutOrder
  const visibleOrder = useMemo(
    () => filterDashboardLayout(activeOrder, hasPermission),
    [activeOrder, hasPermission],
  )
  const packedWidgets = useMemo(() => packDashboardLayout(visibleOrder), [visibleOrder])

  useDragAutoScroll(editMode && Boolean(draggingId))

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

  function handleDragStart(event, widgetId) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', widgetId)
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
    const showOperationalKpis = canViewOperationalKpis(hasPermission)
    const showFinancialKpis = canViewFinancialKpis(hasPermission)
    const revenueParts = formatMoneyParts(financial.total_revenue)
    const outstandingParts = formatMoneyParts(financial.outstanding_balance)
    const expensesParts = formatMoneyParts(financial.total_expenses)
    const kpiCount = (showOperationalKpis ? 2 : 0) + (showFinancialKpis ? 3 : 0)
    const kpiGridClass = kpiCount >= 5
      ? 'sm:grid-cols-2 xl:grid-cols-5'
      : kpiCount === 3
        ? 'sm:grid-cols-2 xl:grid-cols-3'
        : 'sm:grid-cols-2'

    return {
      kpis: kpiCount > 0 ? (
        <section className={`${BENTO_CARD_CLASS} p-6`}>
          <div className={`kpi-grid grid gap-4 ${kpiGridClass}`}>
          {showOperationalKpis ? (
            <>
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
            </>
          ) : null}
          {showFinancialKpis ? (
            <>
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
            </>
          ) : null}
          </div>
        </section>
      ) : null,
      taskOverview: <TaskOverviewBlock />,
      chantierDistribution: <ChantierDistributionChart byStatus={projects.by_status} />,
      dailySchedule: <DailyScheduleFeed />,
      workspaceCalendar: <WorkspaceCalendar />,
      financialActivity: <FinancialActivityBlock financial={financial} />,
      recentProjects: <RecentWorkspaceTable projects={recentProjects} />,
    }
  }, [summary, t, hasPermission])

  if (loading && !summary) {
    return (
      <div className={`dashboard list-page mx-auto max-w-[1600px] p-6 ${DASHBOARD_COC_CLASS}`}>
        <p className="text-slate-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (error && !summary) {
    return (
      <div className={`dashboard list-page mx-auto max-w-[1600px] p-6 ${DASHBOARD_COC_CLASS}`}>
        <p className="error">{error}</p>
      </div>
    )
  }

  return (
    <div className={`dashboard list-page mx-auto max-w-[1600px] p-6 ${DASHBOARD_COC_CLASS} ${editMode ? 'dashboard--edit-mode' : ''}`}>
      <header className="page-header dashboard-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="mt-1 text-sm text-[var(--pg-text-muted)]">
            {t('dashboard.welcome', { name: user?.full_name ?? t('layout.profileFallbackName') })}
          </p>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            {editMode ? (
              <>
                <span className="dashboard-edit-badge rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                  {t('dashboard.editModeActive')}
                </span>
                {DASHBOARD_COC_ENABLED ? (
                  <>
                    <NeonButton type="button" variant="ghost" size="sm" onClick={cancelEditMode}>
                      {t('common.cancel')}
                    </NeonButton>
                    <NeonButton type="button" size="sm" onClick={handleSaveLayout}>
                      {t('dashboard.saveLayout')}
                    </NeonButton>
                  </>
                ) : (
                  <>
                    <button type="button" className="ghost" onClick={cancelEditMode}>
                      {t('common.cancel')}
                    </button>
                    <button type="button" onClick={handleSaveLayout}>
                      {t('dashboard.saveLayout')}
                    </button>
                  </>
                )}
              </>
            ) : (
              DASHBOARD_COC_ENABLED ? (
                <NeonButton type="button" variant="ghost" size="sm" onClick={enterEditMode}>
                  {t('dashboard.editMode')}
                </NeonButton>
              ) : (
                <button type="button" className="filter-select" onClick={enterEditMode}>
                  {t('dashboard.editMode')}
                </button>
              )
            )}
          </div>
        ) : null}
      </header>

      <div className={`dashboard-grid grid grid-cols-12 gap-6 ${editMode ? 'dashboard-grid--edit' : ''}`}>
        {packedWidgets.length === 0 ? (
          <p className="col-span-12 rounded-xl border border-slate-800/80 bg-[#0f1013] px-6 py-10 text-center text-sm text-slate-400">
            {t('dashboard.noWidgetsForRole')}
          </p>
        ) : null}
        {packedWidgets.map(({ id: widgetId, colSpan }) => {
          const content = widgetRenderers[widgetId]
          if (!content) {
            return null
          }

          return (
            <DashboardWidgetShell
              key={widgetId}
              widgetId={widgetId}
              colSpan={editMode ? 12 : colSpan}
              editMode={editMode}
              isDragging={draggingId === widgetId}
              isDropTarget={dropTargetId === widgetId}
              onDragStart={(event) => handleDragStart(event, widgetId)}
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
