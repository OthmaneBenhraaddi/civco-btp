import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import StatusBadge from '../../components/StatusBadge'
import SearchInput from '../../components/SearchInput'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as clientsApi from '../../api/clients'
import * as projectsApi from '../../api/projects'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { buildProjectApiPayload } from './constants/projectFormConfig'
import NewProjectModal from './components/NewProjectModal'
import {
  logProjectCreated,
  logProjectDeleted,
  resolveActorLabel,
} from '../history/auditLogActions'

export default function ProjectsPage() {
  const { hasPermission, user, roles } = useAuth()
  const { t } = useTranslation()
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadProjects(page = 1) {
    setLoading(true)
    setError('')

    try {
      const data = await projectsApi.fetchProjects({
        search,
        status: statusFilter || undefined,
        page,
      })
      setProjects(data.data ?? [])
      setMeta(data.meta ?? null)
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [search, statusFilter])

  useEffect(() => {
    clientsApi.fetchClients({ per_page: 100, is_active: true })
      .then((data) => setClients(data.data ?? []))
      .catch(() => setClients([]))
  }, [])

  function openCreate() {
    setModalOpen(true)
  }

  async function handleCreateProject(form) {
    setSaving(true)
    setError('')

    try {
      await projectsApi.createProject(buildProjectApiPayload(form))
      const client = clients.find((item) => String(item.id) === String(form.client_id))
      logProjectCreated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        title: form.objet.trim(),
        nature: form.nature,
        clientName: client?.name,
      })
      setModalOpen(false)
      await loadProjects()
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
      await loadProjects(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.deleteError')))
    }
  }

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('projects.title')}</h1>
        </div>
        <PermissionGate permission="project.create">
          <button type="button" onClick={openCreate} disabled={clients.length === 0}>
            {t('projects.new')}
          </button>
        </PermissionGate>
      </header>

      {clients.length === 0 ? (
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

      {loading ? (
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
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6}>{t('projects.empty')}</td>
                </tr>
              ) : (
                projects.map((project) => (
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
                      {hasPermission('project.delete') ? (
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
        clients={clients}
        onSubmit={handleCreateProject}
        saving={saving}
      />
    </div>
  )
}
