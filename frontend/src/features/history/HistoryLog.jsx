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
        <label className="text-xs text-slate-500">
          <span className="mb-1.5 block font-semibold uppercase tracking-wider">{t('history.filters.user')}</span>
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

        <label className="text-xs text-slate-500">
          <span className="mb-1.5 block font-semibold uppercase tracking-wider">{t('history.filters.project')}</span>
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

        <label className="text-xs text-slate-500">
          <span className="mb-1.5 block font-semibold uppercase tracking-wider">{t('history.filters.action')}</span>
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

      {error ? <p className="mb-6 text-sm text-red-400">{error}</p> : null}

      {loading && logs.length === 0 ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : null}

      {!loading && logs.length === 0 ? (
        <p className="text-sm text-slate-500">{t('history.empty')}</p>
      ) : (
        <div className="relative">
          <div
            className="pointer-events-none absolute bottom-0 left-[5px] top-0 w-px bg-gradient-to-b from-white/[0.08] via-white/[0.06] to-transparent"
            aria-hidden
          />

          <ul className="m-0 max-h-[min(36rem,70vh)] list-none overflow-y-auto p-0 pr-1 custom-scrollbar">
            {logs.map((log, index) => (
              <li
                key={log.id}
                className={[
                  'relative grid grid-cols-[12px_1fr] gap-x-4 pb-8',
                  index === logs.length - 1 ? 'pb-0' : '',
                ].join(' ')}
              >
                <div className="relative flex justify-center pt-1.5">
                  <span
                    className={[
                      'relative z-[1] h-2.5 w-2.5 rounded-full ring-2 ring-[#0b0c0e]',
                      ACTION_DOT_CLASS[log.action] ?? ACTION_DOT_CLASS.modification,
                    ].join(' ')}
                    aria-hidden
                  />
                </div>

                <div className="min-w-0 border-b border-white/[0.04] pb-6 last:border-b-0">
                  <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-white">{log.actor}</span>
                    <time className="text-xs tabular-nums text-slate-500">
                      {formatAuditTime(log.timestamp ?? log.created_at, locale)}
                    </time>
                    <span
                      className={[
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        ACTION_BADGE_CLASS[log.action] ?? ACTION_BADGE_CLASS.modification,
                      ].join(' ')}
                    >
                      {actionBadgeLabel(log.action, t)}
                    </span>
                    {log.project_title ? (
                      <span className="text-[11px] text-slate-500">
                        {log.project_reference ? `${log.project_reference} · ` : ''}{log.project_title}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-400">{log.message ?? log.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lastPage > 1 ? (
        <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-5 text-xs text-slate-500">
          <button
            type="button"
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 transition hover:bg-white/[0.04] disabled:opacity-40"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            {t('common.previous')}
          </button>
          <span>{t('history.pageOf', { current: currentPage, total: lastPage })}</span>
          <button
            type="button"
            className="rounded-lg border border-white/[0.08] px-3 py-1.5 transition hover:bg-white/[0.04] disabled:opacity-40"
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
