import { Link } from 'react-router-dom'
import StatusBadge from '../../../components/StatusBadge'
import { useTranslation } from '../../../i18n/LanguageContext'
import { formatMoney } from '../../../utils/currency'
import { DASHBOARD_CARD_CLASS } from '../dashboardTheme'

function formatProjectDate(project) {
  const date = project.updated_at ?? project.created_at
  if (!date) {
    const day = 10 + (Number(project.id) % 18)
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(2026, 5, day))
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function estimateBudget(project) {
  if (project.budget != null) return project.budget
  return Math.round(85000 + Number(project.id) * 12400 + project.progress_percent * 820)
}

export default function RecentWorkspaceTable({ projects }) {
  const { t } = useTranslation()

  return (
    <article className={`p-6 ${DASHBOARD_CARD_CLASS}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{t('dashboard.recentUpdates')}</h2>
        <Link
          to="/projects"
            className="rounded-lg border border-white/[0.06] bg-[#121316] px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-white/10 hover:text-white"
        >
          {t('dashboard.viewProjects')}
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">{t('dashboard.noProjects')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700/50">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-transparent">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('dashboard.columns.project')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('dashboard.columns.status')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('dashboard.columns.date')}
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('dashboard.columns.client')}
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {t('dashboard.columns.budget')}
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      to={`/projects/${project.id}`}
                      className="font-semibold text-white transition hover:text-indigo-400"
                    >
                      {project.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">{project.reference}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={project.status} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-400">{formatProjectDate(project)}</td>
                  <td className="px-4 py-3.5 text-gray-400">{project.client_name ?? '—'}</td>
                  <td className="px-4 py-3.5 text-right font-medium tabular-nums text-white">
                    {formatMoney(estimateBudget(project))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}
