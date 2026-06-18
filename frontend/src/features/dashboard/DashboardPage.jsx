import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import KpiCard from '../../components/KpiCard'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as dashboardApi from '../../api/dashboard'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatMoneyParts } from '../../utils/currency'

function EmptyProjectsPlaceholder({ message }) {
  return <p className="mt-4 text-sm text-slate-500">{message}</p>
}

export default function DashboardPage() {
  const { t, locale } = useTranslation()
  const { company } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!company?.id) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    dashboardApi.fetchDashboardSummary()
      .then((data) => {
        if (!cancelled) {
          setSummary(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(extractErrorMessage(err, t('dashboard.loadError')))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [t, company?.id])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-gray-700/50 bg-[#1f2937] px-5 py-3 shadow-2xl">
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
          <p className="text-sm font-medium text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
      </div>
    )
  }

  const statusEntries = Object.entries(summary?.projects?.by_status ?? {})
  const revenueParts = formatMoneyParts(summary.financial.total_revenue, locale)
  const outstandingParts = formatMoneyParts(summary.financial.outstanding_balance, locale)
  const expensesParts = formatMoneyParts(summary.financial.total_expenses, locale)

  return (
    <div className="dashboard w-full bg-[#111827]">
      <header className="px-6 pt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{t('dashboard.title')}</h1>
      </header>

      <section className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label={t('dashboard.kpi.totalProjects')}
          value={summary.projects.total}
          hint={t('dashboard.kpi.activeProjects', { count: summary.projects.active_count })}
          variant="operational"
        />
        <KpiCard
          label={t('dashboard.kpi.averageProgress')}
          value={`${summary.projects.average_progress}%`}
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
          hint={t('dashboard.kpi.overdueInvoices', { count: summary.financial.overdue_invoices_count })}
          variant="warning"
        />
        <KpiCard
          label={t('dashboard.kpi.totalExpenses')}
          moneyAmount={expensesParts.amount}
          moneyCurrency={expensesParts.currency}
          variant="expense"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 px-6 pb-6 lg:grid-cols-12">
        <article className="rounded-2xl border border-slate-800/80 bg-[#1f2937] p-6 shadow-lg lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">{t('dashboard.projectsByStatus')}</h2>
            <span className="rounded-lg border border-slate-700/50 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-400">
              {summary.projects.total}
            </span>
          </div>

          {statusEntries.length === 0 ? (
            <EmptyProjectsPlaceholder message={t('dashboard.noProjects')} />
          ) : (
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {statusEntries.map(([status, count]) => (
                <li
                  key={status}
                  className="flex items-center justify-between rounded-lg border border-slate-800/50 bg-[#111827]/40 px-4 py-3 transition-colors hover:border-slate-700/60 hover:bg-[#111827]/60"
                >
                  <StatusBadge status={status} />
                  <span className="font-mono text-sm font-semibold tabular-nums text-slate-300">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-2xl border border-slate-800/80 bg-[#1f2937] p-6 shadow-lg lg:col-span-7">
          <h2 className="text-base font-semibold text-white">{t('dashboard.recentProjects')}</h2>

          {summary.recent_projects.length === 0 ? (
            <EmptyProjectsPlaceholder message={t('dashboard.noProjects')} />
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800/60">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-[#111827]/50">
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {t('projects.reference')}
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {t('projects.projectTitle')}
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {t('projects.client')}
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {t('projects.status')}
                      </th>
                      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {t('projects.progress')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recent_projects.map((project) => (
                      <tr
                        key={project.id}
                        className="border-b border-slate-800/40 transition-colors last:border-0 hover:bg-[#111827]/30"
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            to={`/projects/${project.id}`}
                            className="font-medium text-blue-400 transition hover:text-blue-300"
                          >
                            {project.reference}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-200">{project.title}</td>
                        <td className="px-4 py-3.5 text-slate-400">{project.client_name ?? '—'}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={project.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                                style={{ width: `${project.progress_percent}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs tabular-nums text-slate-400">
                              {project.progress_percent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </article>
      </section>

      <footer className="flex flex-wrap items-center gap-2 border-t border-slate-800/60 px-6 pb-6 pt-2">
        <span className="text-sm font-medium text-slate-400">{t('dashboard.quickLinks')}:</span>
        <Link
          to="/clients"
          className="ml-3 rounded-xl border border-slate-700/50 bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 transition-all hover:bg-slate-700"
        >
          {t('nav.clients')}
        </Link>
        <Link
          to="/projects"
          className="rounded-xl border border-slate-700/50 bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 transition-all hover:bg-slate-700"
        >
          {t('nav.projects')}
        </Link>
      </footer>
    </div>
  )
}
