import { useCallback, useEffect, useState } from 'react'
import * as activityLogsApi from '../../api/activityLogs'
import * as projectsApi from '../../api/projects'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { extractErrorMessage } from '../../utils/apiHelpers'
import {
  ACTION_BADGE_CLASS,
  ACTION_DOT_CLASS,
  actionBadgeLabel,
  formatAuditTime,
} from './auditLogStore'

const ACTION_TYPE_OPTIONS = ['created', 'updated', 'deleted']

export default function HistoryLog() {
  const { t, locale } = useTranslation()
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
      <article className="w-full rounded-2xl border border-slate-800/80 bg-[#1f2937] p-6 text-white shadow-xl">
        <p className="text-sm text-slate-500">{t('history.restricted')}</p>
      </article>
    )
  }

  return (
    <article className="w-full rounded-2xl border border-slate-800/80 bg-[#1f2937] p-6 text-white shadow-xl">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {t('history.title')}
        </h2>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {t('history.liveMonitoring')}
        </span>
      </header>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs text-slate-400">
          <span className="mb-1 block font-semibold uppercase tracking-wider">{t('history.filters.user')}</span>
          <select
            className="filter-select w-full"
            value={filters.user_id}
            onChange={(event) => updateFilter('user_id', event.target.value)}
          >
            <option value="">{t('history.filters.allUsers')}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name ?? user.name ?? user.email}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-400">
          <span className="mb-1 block font-semibold uppercase tracking-wider">{t('history.filters.project')}</span>
          <select
            className="filter-select w-full"
            value={filters.project_id}
            onChange={(event) => updateFilter('project_id', event.target.value)}
          >
            <option value="">{t('history.filters.allProjects')}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.reference} — {project.title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-400">
          <span className="mb-1 block font-semibold uppercase tracking-wider">{t('history.filters.action')}</span>
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

      {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

      {loading && logs.length === 0 ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : null}

      {!loading && logs.length === 0 ? (
        <p className="text-sm text-slate-500">{t('history.empty')}</p>
      ) : (
        <ul className="max-h-[min(32rem,70vh)] overflow-y-auto pr-1 custom-scrollbar">
          {logs.map((log) => (
            <li
              key={log.id}
              className="relative border-l border-slate-800 pb-6 pl-6 last:pb-0"
            >
              <span
                className={[
                  'absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4',
                  ACTION_DOT_CLASS[log.action] ?? ACTION_DOT_CLASS.modification,
                ].join(' ')}
                aria-hidden
              />

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{log.actor}</span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {formatAuditTime(log.timestamp ?? log.created_at, locale)}
                    </span>
                    <span
                      className={[
                        'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                        ACTION_BADGE_CLASS[log.action] ?? ACTION_BADGE_CLASS.modification,
                      ].join(' ')}
                    >
                      {actionBadgeLabel(log.action, t)}
                    </span>
                    {log.project_title ? (
                      <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                        {log.project_reference ? `${log.project_reference} · ` : ''}{log.project_title}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{log.message ?? log.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lastPage > 1 ? (
        <div className="mt-6 flex items-center justify-between border-t border-slate-800/60 pt-4 text-xs text-slate-400">
          <button
            type="button"
            className="rounded-lg border border-slate-700/60 px-3 py-1.5 transition hover:bg-white/[0.04] disabled:opacity-40"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {t('common.previous')}
          </button>
          <span>{t('history.pageOf', { current: currentPage, total: lastPage })}</span>
          <button
            type="button"
            className="rounded-lg border border-slate-700/60 px-3 py-1.5 transition hover:bg-white/[0.04] disabled:opacity-40"
            disabled={currentPage >= lastPage}
            onClick={() => setPage((value) => value + 1)}
          >
            {t('common.next')}
          </button>
        </div>
      ) : null}
    </article>
  )
}
