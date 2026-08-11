import { useEffect, useMemo, useState } from 'react'
import ActivityLogFeed from '../history/ActivityLogFeed'
import { useTranslation } from '../../i18n/LanguageContext'
import {
  filterSuperAdminLogs,
  getSuperAdminFilterOptions,
  SUPER_ADMIN_DEMO_LOGS,
  SUPER_ADMIN_LOG_ENTITIES,
  SUPER_ADMIN_LOGS_PER_PAGE,
} from './data/systemLogsDemo'
import {
  mergeSuperAdminLogs,
  readPlatformLogs,
  SA_PLATFORM_LOG_EVENT,
} from './data/superAdminPlatformLogStore'
import { TEAM_DIRECTORY_REFRESH_EVENT } from '../profile/profileSyncEvents'

const ACTION_TYPE_OPTIONS = ['created', 'updated', 'deleted']

export default function SuperAdminSystemLogsPage() {
  const { t, locale } = useTranslation()
  const [page, setPage] = useState(1)
  const [platformLogs, setPlatformLogs] = useState(() => readPlatformLogs())
  const [filters, setFilters] = useState({
    tenant_slug: '',
    user_id: '',
    project_id: '',
    action_type: '',
  })

  useEffect(() => {
    function refreshPlatformLogs() {
      setPlatformLogs(readPlatformLogs())
    }

    window.addEventListener(SA_PLATFORM_LOG_EVENT, refreshPlatformLogs)
    window.addEventListener(TEAM_DIRECTORY_REFRESH_EVENT, refreshPlatformLogs)
    return () => {
      window.removeEventListener(SA_PLATFORM_LOG_EVENT, refreshPlatformLogs)
      window.removeEventListener(TEAM_DIRECTORY_REFRESH_EVENT, refreshPlatformLogs)
    }
  }, [])

  const allLogs = useMemo(
    () => mergeSuperAdminLogs(SUPER_ADMIN_DEMO_LOGS, platformLogs),
    [platformLogs],
  )

  const scopedLogs = useMemo(
    () => filterSuperAdminLogs(allLogs, {
      tenant_slug: filters.tenant_slug,
      user_id: '',
      project_id: '',
      action_type: '',
    }),
    [allLogs, filters.tenant_slug],
  )

  const filterOptions = useMemo(
    () => getSuperAdminFilterOptions(scopedLogs),
    [scopedLogs],
  )

  const filteredLogs = useMemo(
    () => filterSuperAdminLogs(allLogs, filters),
    [allLogs, filters],
  )

  const lastPage = Math.max(1, Math.ceil(filteredLogs.length / SUPER_ADMIN_LOGS_PER_PAGE))

  const safePage = Math.min(page, lastPage)

  const paginatedLogs = useMemo(() => {
    const start = (safePage - 1) * SUPER_ADMIN_LOGS_PER_PAGE
    return filteredLogs.slice(start, start + SUPER_ADMIN_LOGS_PER_PAGE)
  }, [filteredLogs, safePage])

  function updateFilter(key, value) {
    setPage(1)
    setFilters((current) => {
      const next = { ...current, [key]: value }

      if (key === 'tenant_slug') {
        next.user_id = ''
        next.project_id = ''
      }

      return next
    })
  }

  return (
    <div className="min-h-full w-full bg-[#0b0c0e]">
      <div className="mx-auto max-w-4xl px-6 py-6">
        <article className="w-full">
          <header className="mb-8 flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                {t('history.title')}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{t('superAdmin.logs.subtitle')}</p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {t('history.liveMonitoring')}
            </span>
          </header>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs text-slate-500">
              <span className="mb-1.5 block font-semibold uppercase tracking-wider">
                {t('superAdmin.logs.filters.entity')}
              </span>
              <select
                className="filter-select w-full"
                value={filters.tenant_slug}
                onChange={(event) => updateFilter('tenant_slug', event.target.value)}
              >
                {SUPER_ADMIN_LOG_ENTITIES.map((entity) => (
                  <option key={entity.slug || 'all'} value={entity.slug}>
                    {t(entity.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500">
              <span className="mb-1.5 block font-semibold uppercase tracking-wider">
                {t('history.filters.user')}
              </span>
              <select
                className="filter-select w-full"
                value={filters.user_id}
                onChange={(event) => updateFilter('user_id', event.target.value)}
              >
                <option value="">{t('history.filters.allUsers')}</option>
                {filterOptions.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500">
              <span className="mb-1.5 block font-semibold uppercase tracking-wider">
                {t('history.filters.project')}
              </span>
              <select
                className="filter-select w-full"
                value={filters.project_id}
                onChange={(event) => updateFilter('project_id', event.target.value)}
              >
                <option value="">{t('history.filters.allProjects')}</option>
                {filterOptions.projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.reference} — {project.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs text-slate-500">
              <span className="mb-1.5 block font-semibold uppercase tracking-wider">
                {t('history.filters.action')}
              </span>
              <select
                className="filter-select w-full"
                value={filters.action_type}
                onChange={(event) => updateFilter('action_type', event.target.value)}
              >
                <option value="">{t('history.filters.allActions')}</option>
                {ACTION_TYPE_OPTIONS.map((actionType) => (
                  <option key={actionType} value={actionType}>
                    {t(`history.actionTypes.${actionType}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ActivityLogFeed
            logs={paginatedLogs}
            emptyLabel={t('history.empty')}
            page={safePage}
            lastPage={lastPage}
            onPageChange={setPage}
            t={t}
            locale={locale}
          />
        </article>
      </div>
    </div>
  )
}
