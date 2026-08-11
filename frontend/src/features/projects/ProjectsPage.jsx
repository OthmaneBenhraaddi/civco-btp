import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import SearchInput from '../../components/SearchInput'
import { useAuth } from '../../context/AuthContext'
import { useStealthMode, useStealthModeRefresh } from '../../context/StealthModeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { LIVE_SYNC_INTERVAL_MS, useAutoRefresh } from '../../hooks/useAutoRefresh'
import * as clientsApi from '../../api/clients'
import * as projectsApi from '../../api/projects'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { filterOfficialClients, filterOfficialLinkedRecords } from '../../utils/stealthVisibility'
import { buildProjectApiPayload } from './constants/projectFormConfig'
import NewProjectModal from './components/NewProjectModal'
import {
  logProjectCreated,
  logProjectDeleted,
  resolveActorLabel,
} from '../history/auditLogActions'

export default function ProjectsPage() {
  const { isAdmin, user, roles } = useAuth()
  const { stealthMode } = useStealthMode()
  const stealthModeRef = useRef(stealthMode)
  stealthModeRef.current = stealthMode
  const { t } = useTranslation()
  const [projects, setProjects] = useState([])
  const projectsBaselineRef = useRef([])
  const [clients, setClients] = useState([])
  const clientsBaselineRef = useRef([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [clientsLoading, setClientsLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [search])

  const loadProjects = useCallback(async ({ silent = false, page: nextPage = page } = {}) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const data = await projectsApi.fetchProjects({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page: nextPage,
      })
      const list = data.data ?? []
      setProjects(list)
      setMeta(data.meta ?? null)
      setPage(nextPage)

      if (!stealthModeRef.current) {
        projectsBaselineRef.current = list
      }
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('projects.loadError')))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [page, debouncedSearch, statusFilter, t])

  useEffect(() => {
    loadProjects({ page: 1 })
  }, [debouncedSearch, statusFilter])

  useAutoRefresh(loadProjects, [loadProjects], { runOnMount: false, intervalMs: 60000 })

  const loadClientOptions = useCallback(() => {
    setClientsLoading(true)

    return clientsApi.fetchClientsForPicker()
      .then((data) => {
        const list = data.data ?? []
        setClients(list)
        if (!stealthModeRef.current) {
          clientsBaselineRef.current = list
        }
        return list
      })
      .catch(() => {
        setClients([])
        return []
      })
      .finally(() => {
        setClientsLoading(false)
      })
  }, [])

  useEffect(() => {
    if (isAdmin) {
      loadClientOptions()
    }
  }, [isAdmin, loadClientOptions])

  useEffect(() => {
    if (modalOpen && clients.length === 0 && !clientsLoading) {
      loadClientOptions()
    }
  }, [modalOpen, clients.length, clientsLoading, loadClientOptions])

  useStealthModeRefresh(({ active }) => {
    if (!active) {
      if (projectsBaselineRef.current.length > 0) {
        setProjects(projectsBaselineRef.current)
      }
      if (clientsBaselineRef.current.length > 0) {
        setClients(clientsBaselineRef.current)
      }
      loadProjects({ page: meta?.current_page ?? page, silent: true })
      loadClientOptions()
    }
  })

  const visibleProjects = useMemo(
    () => (stealthMode ? filterOfficialLinkedRecords(projects) : projects),
    [projects, stealthMode],
  )

  const visibleClients = useMemo(
    () => (stealthMode ? filterOfficialClients(clients) : clients),
    [clients, stealthMode],
  )

  function openCreate() {
    setModalOpen(true)
    if (clients.length === 0) {
      loadClientOptions()
    }
  }

  async function handleCreateProject(form) {
    setSaving(true)
    setError('')

    try {
      await projectsApi.createProject(buildProjectApiPayload(form, form.sectors ?? []))
      const client = clients.find((item) => String(item.id) === String(form.client_id))
      logProjectCreated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        title: form.objet.trim(),
        nature: form.sectorName,
        clientName: client?.name,
      })
      setModalOpen(false)
      await loadProjects({ page: 1 })
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.createError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(project) {
    if (!window.confirm(t('projects.deleteConfirm', { title: project.title }))) {
      return
    }

    try {
      await projectsApi.deleteProject(project.id)
      logProjectDeleted({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        title: project.title,
      })
      await loadProjects({ page: meta?.current_page ?? 1 })
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.deleteError')))
    }
  }

  const canCreateProject = isAdmin && !clientsLoading && visibleClients.length > 0
  const showNeedClientHint = isAdmin && !clientsLoading && visibleClients.length === 0

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('projects.title')}</h1>
        </div>
        {isAdmin ? (
          <button type="button" onClick={openCreate} disabled={!canCreateProject}>
            {t('projects.new')}
          </button>
        ) : null}
      </header>

      {showNeedClientHint ? (
        <p className="hint">{t('projects.needClient')}</p>
      ) : null}

      <div className="toolbar">
        <SearchInput
          placeholder={t('projects.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">{t('projects.allStatuses')}</option>
          <option value="draft">{t('status.draft')}</option>
          <option value="planned">{t('status.planned')}</option>
          <option value="in_progress">{t('status.in_progress')}</option>
          <option value="on_hold">{t('status.on_hold')}</option>
          <option value="completed">{t('status.completed')}</option>
          <option value="cancelled">{t('status.cancelled')}</option>
        </select>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading && visibleProjects.length === 0 ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('projects.reference')}</th>
                <th>{t('projects.projectTitle')}</th>
                <th>{t('projects.client')}</th>
                <th>{t('projects.status')}</th>
                <th>{t('projects.progress')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visibleProjects.length === 0 ? (
                <tr>
                  <td colSpan={6}>{t('projects.empty')}</td>
                </tr>
              ) : (
                visibleProjects.map((project) => (
                  <tr key={project.id}>
                    <td>{project.reference}</td>
                    <td>
                      <Link to={`/projects/${project.id}`}>{project.title}</Link>
                    </td>
                    <td>{project.client?.name ?? '—'}</td>
                    <td><StatusBadge status={project.status} /></td>
                    <td>{project.progress_percent}%</td>
                    <td className="actions">
                      <Link
                        to={`/projects/${project.id}`}
                        className="btn-action inline-flex items-center justify-center px-3 py-1.5 leading-none"
                      >
                        {t('projects.open')}
                      </Link>
                      {isAdmin ? (
                        <button
                          type="button"
                          className="ghost danger inline-flex items-center justify-center px-3 py-1.5 leading-none"
                          onClick={() => handleDelete(project)}
                        >
                          {t('common.delete')}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={visibleClients}
        onSubmit={handleCreateProject}
        saving={saving}
      />
    </div>
  )
}
