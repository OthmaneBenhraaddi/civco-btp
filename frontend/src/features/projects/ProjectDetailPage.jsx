import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as projectsApi from '../../api/projects'
import ProjectDocumentsTab from './ProjectDocumentsTab'
import ProjectExpensesTab from './ProjectExpensesTab'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'
import {
  logProjectUpdated,
  resolveActorLabel,
} from '../history/auditLogActions'

const TAB_KEYS = ['overview', 'planning', 'team', 'progress', 'documents', 'expenses']

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { hasPermission, user, roles } = useAuth()
  const { t } = useTranslation()
  const canUpdate = hasPermission('project.update')

  const [project, setProject] = useState(null)
  const [companyUsers, setCompanyUsers] = useState([])
  const [tab, setTab] = useState('planning')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [phaseName, setPhaseName] = useState('')
  const [taskForms, setTaskForms] = useState({})
  const [taskProgress, setTaskProgress] = useState({})
  const [teamForm, setTeamForm] = useState({ user_id: '', role_label: '' })
  const [progressForm, setProgressForm] = useState({ percent: '', comment: '' })

  async function loadProject(options = { initial: false }) {
    if (options.initial) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError('')

    try {
      const data = await projectsApi.fetchProject(id)
      const projectData = data.data ?? data
      setProject(projectData)

      const progressMap = {}
      unwrapResource(projectData.phases).forEach((phase) => {
        unwrapResource(phase.tasks).forEach((task) => {
          progressMap[task.id] = task.progress_percent
        })
      })
      setTaskProgress(progressMap)
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.loadProjectError')))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadProject({ initial: true })
    projectsApi.fetchCompanyUsers()
      .then((data) => setCompanyUsers(unwrapResource(data.data ?? data)))
      .catch(() => setCompanyUsers([]))
  }, [id])

  async function handleProjectUpdate(field, value) {
    if (!canUpdate) {
      return
    }

    setSaving(true)
    try {
      const updated = await projectsApi.updateProject(id, { [field]: value })
      setProject(updated.data ?? updated)

      const actor = resolveActorLabel(user, roles, t('layout.profileFallbackName'))
      const projectTitle = project?.title ?? updated.data?.title ?? updated.title ?? 'Projet'

      if (field === 'progress_percent') {
        logProjectUpdated({
          actor,
          title: projectTitle,
          detail: `A mis à jour l'avancement technique du projet ${projectTitle} à '${value}%'`,
        })
      } else {
        logProjectUpdated({
          actor,
          title: projectTitle,
          detail: `A modifié le projet « ${projectTitle} » (${field})`,
        })
      }
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.updateError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddPhase(event) {
    event.preventDefault()
    if (!phaseName.trim()) {
      return
    }

    setSaving(true)
    setError('')
    try {
      await projectsApi.createPhase(id, { name: phaseName.trim() })
      setPhaseName('')
      await loadProject()
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.planning.addPhaseError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTask(phaseId) {
    const form = taskForms[phaseId] ?? { title: '', assigned_to_user_id: '' }
    if (!form.title.trim()) {
      return
    }

    setSaving(true)
    setError('')
    try {
      await projectsApi.createTask(phaseId, {
        title: form.title.trim(),
        assigned_to_user_id: form.assigned_to_user_id ? Number(form.assigned_to_user_id) : null,
      })
      setTaskForms({ ...taskForms, [phaseId]: { title: '', assigned_to_user_id: '' } })
      await loadProject()
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.planning.addTaskError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleTaskProgressCommit(task) {
    const progress = taskProgress[task.id] ?? task.progress_percent
    if (Number(progress) === Number(task.progress_percent)) {
      return
    }

    setSaving(true)
    setError('')
    try {
      await projectsApi.updateTask(task.id, {
        progress_percent: Number(progress),
        status: Number(progress) === 100 ? 'done' : 'in_progress',
      })
      await loadProject()
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.planning.updateTaskError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePhase(phaseId) {
    if (!window.confirm(t('projects.planning.deletePhaseConfirm'))) {
      return
    }

    setSaving(true)
    setError('')
    try {
      await projectsApi.deletePhase(phaseId)
      await loadProject()
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.updateError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTask(taskId) {
    setSaving(true)
    setError('')
    try {
      await projectsApi.deleteTask(taskId)
      await loadProject()
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.planning.updateTaskError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTeamMember(event) {
    event.preventDefault()
    if (!teamForm.user_id) {
      return
    }

    setSaving(true)
    setError('')
    try {
      const updated = await projectsApi.addTeamMember(id, {
        user_id: Number(teamForm.user_id),
        role_label: teamForm.role_label || null,
      })
      setProject(updated.data ?? updated)
      setTeamForm({ user_id: '', role_label: '' })
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.team.addError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveTeamMember(userId) {
    setSaving(true)
    setError('')
    try {
      await projectsApi.removeTeamMember(id, userId)
      await loadProject()
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.team.removeError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddProgress(event) {
    event.preventDefault()
    if (progressForm.percent === '') {
      return
    }

    setSaving(true)
    setError('')
    try {
      await projectsApi.createProgressSnapshot(id, {
        percent: Number(progressForm.percent),
        comment: progressForm.comment || null,
      })
      setProgressForm({ percent: '', comment: '' })
      await loadProject()
    } catch (err) {
      setError(extractErrorMessage(err, t('projects.progressTab.recordError')))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="list-page">{t('common.loading')}</p>
  }

  if (!project) {
    return (
      <div className="list-page">
        <p className="error">{error || t('projects.notFound')}</p>
        <Link to="/projects">{t('nav.projects')}</Link>
      </div>
    )
  }

  const phases = unwrapResource(project.phases)
  const teamMembers = unwrapResource(project.team_members)
  const progressSnapshots = unwrapResource(project.progress_snapshots)

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/projects">{t('nav.projects')}</Link> / {project.reference}
          </p>
          <h1>{project.title}</h1>
          <div className="inline-meta">
            <StatusBadge status={project.status} />
            <span>{t('projects.complete', { percent: project.progress_percent })}</span>
            <span>{project.client?.name}</span>
            {refreshing ? <span className="hint">{t('common.saving')}</span> : null}
          </div>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}
      {saving ? <p className="hint">{t('common.saving')}</p> : null}

      {!canUpdate ? (
        <p className="hint banner-warning">{t('common.noPermission')}</p>
      ) : null}

      <div className="tabs">
        {TAB_KEYS.map((item) => (
          <button
            key={item}
            type="button"
            className={tab === item ? 'tab active' : 'tab'}
            onClick={() => setTab(item)}
          >
            {t(`projects.tabs.${item}`)}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <section className="card">
          <div className="form-row">
            <label>
              {t('projects.status')}
              <CutSelect
                className="w-full"
                value={project.status}
                disabled={!canUpdate}
                onChange={(status) => handleProjectUpdate('status', status)}
                options={[
                  { value: 'draft', label: t('status.draft') },
                  { value: 'planned', label: t('status.planned') },
                  { value: 'in_progress', label: t('status.in_progress') },
                  { value: 'on_hold', label: t('status.on_hold') },
                  { value: 'completed', label: t('status.completed') },
                  { value: 'cancelled', label: t('status.cancelled') },
                ]}
              />
            </label>
            <label>
              {t('projects.overview.budget')}
              <input
                type="number"
                min="0"
                step="0.01"
                defaultValue={project.budget ?? ''}
                disabled={!canUpdate}
                onBlur={(event) => handleProjectUpdate('budget', event.target.value === '' ? null : Number(event.target.value))}
              />
            </label>
          </div>
          <p>{project.description || t('projects.overview.noDescription')}</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${project.progress_percent}%` }} />
          </div>
          <p className="hint">
            {project.site_address_line1 || t('projects.overview.noSiteAddress')}
            {project.site_city ? `, ${project.site_city}` : ''}
          </p>
        </section>
      ) : null}

      {tab === 'planning' ? (
        <section className="stack">
          {canUpdate ? (
            <form className="inline-form card" onSubmit={handleAddPhase}>
              <input
                placeholder={t('projects.planning.newPhase')}
                value={phaseName}
                onChange={(event) => setPhaseName(event.target.value)}
              />
              <NeonButton type="submit" size="sm" disabled={saving}>
                {t('projects.planning.addPhase')}
              </NeonButton>
            </form>
          ) : null}

          {phases.length === 0 ? (
            <p className="hint card">{t('projects.planning.noPhases')}</p>
          ) : null}

          {phases.map((phase) => (
            <article key={phase.id} className="card">
              <header className="card-header">
                <div>
                  <h3>{phase.name}</h3>
                  <p>{t('projects.planning.phaseProgress', { percent: phase.progress_percent })}</p>
                </div>
                {canUpdate ? (
                  <button type="button" className="ghost danger" onClick={() => handleDeletePhase(phase.id)}>
                    {t('projects.planning.deletePhase')}
                  </button>
                ) : null}
              </header>

              <ul className="task-list">
                {unwrapResource(phase.tasks).map((task) => (
                  <li key={task.id} className="task-item">
                    <div>
                      <strong>{task.title}</strong>
                      <div className="inline-meta">
                        <StatusBadge status={task.status} />
                        <span>{taskProgress[task.id] ?? task.progress_percent}%</span>
                        {task.assigned_to ? <span>{task.assigned_to.full_name}</span> : null}
                      </div>
                    </div>
                    {canUpdate ? (
                      <div className="task-actions">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={taskProgress[task.id] ?? task.progress_percent}
                          onChange={(event) => setTaskProgress({
                            ...taskProgress,
                            [task.id]: Number(event.target.value),
                          })}
                          onMouseUp={() => handleTaskProgressCommit(task)}
                          onTouchEnd={() => handleTaskProgressCommit(task)}
                        />
                        <button type="button" className="ghost danger" onClick={() => handleDeleteTask(task.id)}>
                          {t('common.delete')}
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>

              {canUpdate ? (
                <div className="inline-form">
                  <input
                    placeholder={t('projects.planning.newTask')}
                    value={taskForms[phase.id]?.title ?? ''}
                    onChange={(event) => setTaskForms({
                      ...taskForms,
                      [phase.id]: {
                        ...(taskForms[phase.id] ?? {}),
                        title: event.target.value,
                      },
                    })}
                  />
                  <CutSelect
                    value={taskForms[phase.id]?.assigned_to_user_id ?? ''}
                    onChange={(assigned_to_user_id) => setTaskForms({
                      ...taskForms,
                      [phase.id]: {
                        ...(taskForms[phase.id] ?? { title: '' }),
                        assigned_to_user_id,
                      },
                    })}
                    options={[
                      { value: '', label: t('projects.planning.unassigned') },
                      ...companyUsers.map((user) => ({
                        value: String(user.id),
                        label: user.full_name,
                      })),
                    ]}
                  />
                  <NeonButton
                    type="button"
                    size="sm"
                    onClick={() => handleAddTask(phase.id)}
                    disabled={saving}
                  >
                    {t('projects.planning.addTask')}
                  </NeonButton>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'team' ? (
        <section className="stack">
          {canUpdate ? (
            <form className="inline-form card" onSubmit={handleAddTeamMember}>
              <CutSelect
                value={teamForm.user_id}
                onChange={(user_id) => setTeamForm({ ...teamForm, user_id })}
                placeholder={t('projects.team.selectUser')}
                options={[
                  { value: '', label: t('projects.team.selectUser') },
                  ...companyUsers.map((user) => ({
                    value: String(user.id),
                    label: user.full_name,
                  })),
                ]}
              />
              <input
                placeholder={t('projects.team.roleLabel')}
                value={teamForm.role_label}
                onChange={(event) => setTeamForm({ ...teamForm, role_label: event.target.value })}
              />
              <button type="submit" disabled={saving}>{t('projects.team.addMember')}</button>
            </form>
          ) : null}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('projects.team.name')}</th>
                  <th>{t('projects.team.email')}</th>
                  <th>{t('projects.team.role')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.length === 0 ? (
                  <tr><td colSpan={4}>{t('projects.team.empty')}</td></tr>
                ) : (
                  teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.full_name}</td>
                      <td>{member.email}</td>
                      <td>{member.role_label || '—'}</td>
                      <td>
                        {canUpdate ? (
                          <button type="button" className="ghost danger" onClick={() => handleRemoveTeamMember(member.id)}>
                            {t('projects.team.remove')}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'progress' ? (
        <section className="stack">
          {canUpdate ? (
            <form className="inline-form card" onSubmit={handleAddProgress}>
              <input
                type="number"
                min="0"
                max="100"
                placeholder={t('projects.progressTab.percent')}
                value={progressForm.percent}
                onChange={(event) => setProgressForm({ ...progressForm, percent: event.target.value })}
                required
              />
              <input
                placeholder={t('projects.progressTab.comment')}
                value={progressForm.comment}
                onChange={(event) => setProgressForm({ ...progressForm, comment: event.target.value })}
              />
              <button type="submit" disabled={saving}>{t('projects.progressTab.record')}</button>
            </form>
          ) : null}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('projects.progressTab.date')}</th>
                  <th>{t('projects.progress')}</th>
                  <th>{t('projects.progressTab.comment')}</th>
                  <th>{t('projects.progressTab.recordedBy')}</th>
                </tr>
              </thead>
              <tbody>
                {progressSnapshots.length === 0 ? (
                  <tr><td colSpan={4}>{t('projects.progressTab.empty')}</td></tr>
                ) : (
                  progressSnapshots.map((snapshot) => (
                    <tr key={snapshot.id}>
                      <td>{new Date(snapshot.recorded_at).toLocaleString()}</td>
                      <td>{snapshot.percent}%</td>
                      <td>{snapshot.comment || '—'}</td>
                      <td>{snapshot.recorded_by?.full_name ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === 'documents' ? (
        <ProjectDocumentsTab projectId={id} />
      ) : null}

      {tab === 'expenses' ? (
        <ProjectExpensesTab projectId={id} />
      ) : null}
    </div>
  )
}
