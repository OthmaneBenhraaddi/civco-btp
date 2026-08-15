import { useCallback, useEffect, useState } from 'react'
import * as activityLogsApi from '../../api/activityLogs'
import * as projectsApi from '../../api/projects'
import CutSelect from '../../components/prodigy/CutSelect'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { extractErrorMessage } from '../../utils/apiHelpers'
import ActivityLogFeed from './ActivityLogFeed'

const ACTION_TYPE_OPTIONS = ['created', 'updated', 'deleted']

export default function HistoryLog() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    user_id: '',
    project_id: '',
    action_type: '',
  })
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])

  const loadLogs = useCallback(async ({ silent = false } = {}) => {
    if (!isAdmin) {
      setLoading(false)
      return
    }

    if (!silent) {
      setLoading(true)
    }
    setError('')

    try {
      const params = {
        page,
        per_page: 30,
      }

      if (filters.user_id) {
        params.user_id = filters.user_id
      }
      if (filters.project_id) {
        params.project_id = filters.project_id
      }
      if (filters.action_type) {
        params.action_type = filters.action_type
      }

      const result = await activityLogsApi.fetchActivityLogs(params)
      setLogs(result.items)
      setMeta(result.meta ?? {})
    } catch (err) {
      setError(extractErrorMessage(err, t('history.loadError')))
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [filters, isAdmin, page, t])

  useEffect(() => {
    if (!isAdmin) {
      return
    }

    async function loadFilters() {
      try {
        const [usersData, projectsData] = await Promise.all([
          projectsApi.fetchCompanyUsers(),
          projectsApi.fetchProjects({ per_page: 100 }),
        ])
        setUsers(usersData.data ?? usersData ?? [])
        setProjects(projectsData.data ?? [])
      } catch {
        setUsers([])
        setProjects([])
      }
    }

    loadFilters()
  }, [isAdmin])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  useAutoRefresh(() => loadLogs({ silent: true }), [loadLogs], 12000)

  function updateFilter(key, value) {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const lastPage = meta.last_page ?? 1
  const currentPage = meta.current_page ?? page

  if (!isAdmin) {
    return (
      <article className="w-full py-2">
        <p className="text-sm text-slate-500">{t('history.restricted')}</p>
      </article>
    )
  }

  return (
    <article className="w-full">
      <header className="mb-8 flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            {t('history.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{t('history.subtitle')}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {t('history.liveMonitoring')}
        </span>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="text-xs text-slate-500">
          <span className="mb-1.5 block font-semibold uppercase tracking-wider">{t('history.filters.user')}</span>
          <CutSelect
            className="w-full"
            value={filters.user_id}
            onChange={(value) => updateFilter('user_id', value)}
            placeholder={t('history.filters.allUsers')}
            options={[
              { value: '', label: t('history.filters.allUsers') },
              ...users.map((user) => ({
                value: user.id,
                label: user.full_name ?? user.name ?? user.email,
              })),
            ]}
          />
        </div>

        <div className="text-xs text-slate-500">
          <span className="mb-1.5 block font-semibold uppercase tracking-wider">{t('history.filters.project')}</span>
          <CutSelect
            className="w-full"
            value={filters.project_id}
            onChange={(value) => updateFilter('project_id', value)}
            placeholder={t('history.filters.allProjects')}
            options={[
              { value: '', label: t('history.filters.allProjects') },
              ...projects.map((project) => ({
                value: project.id,
                label: `${project.reference} — ${project.title}`,
              })),
            ]}
          />
        </div>

        <div className="text-xs text-slate-500">
          <span className="mb-1.5 block font-semibold uppercase tracking-wider">{t('history.filters.action')}</span>
          <CutSelect
            className="w-full"
            value={filters.action_type}
            onChange={(value) => updateFilter('action_type', value)}
            placeholder={t('history.filters.allActions')}
            options={[
              { value: '', label: t('history.filters.allActions') },
              ...ACTION_TYPE_OPTIONS.map((actionType) => ({
                value: actionType,
                label: t(`history.actionTypes.${actionType}`),
              })),
            ]}
          />
        </div>
      </div>

      {error ? <p className="mb-6 text-sm text-red-400">{error}</p> : null}

      <ActivityLogFeed
        logs={logs}
        loading={loading}
        emptyLabel={t('history.empty')}
        page={currentPage}
        lastPage={lastPage}
        onPageChange={setPage}
        t={t}
      />
    </article>
  )
}
