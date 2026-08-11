import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as projectsApi from '../../api/projects'
import ProjectDocumentsTab from './ProjectDocumentsTab'
import ProjectExpensesTab from './ProjectExpensesTab'
import ProjectAmendmentsTab from './ProjectAmendmentsTab'
import ProjectExcelImportPanel from './components/ProjectExcelImportPanel'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'
import {
  logProjectUpdated,
  resolveActorLabel,
} from '../history/auditLogActions'
import { formatProjectOverviewDescription } from './utils/projectOverview'
import { formatMoney } from '../../utils/currency'
import { canManageAllTasks, canManageTask } from '../tasks/utils/taskPermissions'

const TAB_KEYS = ['overview', 'planning', 'team', 'progress', 'documents', 'expenses', 'amendments']

function getVisibleTabs(hasPermission) {
  return TAB_KEYS.filter((key) => {
    if (key === 'documents') {
      return hasPermission('document.view')
    }

    if (key === 'expenses') {
      return hasPermission('expense.view')
    }

    return true
  })
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const { hasPermission, user, roles, isAdmin } = useAuth()
  const { t, locale } = useTranslation()
  const { pushToast } = useToast()
  const canUpdate = hasPermission('project.update')
  const canEditBudget = isAdmin || hasPermission('project.budget')
  const taskAccess = { user, isAdmin, hasPermission }
  const manageAllTasks = canManageAllTasks(taskAccess)
  const canManagePhases = manageAllTasks
  const visibleTabs = useMemo(() => getVisibleTabs(hasPermission), [hasPermission])

  function canManageProjectTask(task) {
    return canManageTask(
      { assignedToUserId: task.assigned_to?.id ?? task.assigned_to_user_id },
      taskAccess,
    )
  }

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
  const [siteAddressForm, setSiteAddressForm] = useState({
    site_address_line1: '',
    site_city: '',
    site_postal_code: '',
  })

  useEffect(() => {
    if (!visibleTabs.includes(tab)) {
      setTab(visibleTabs[0] ?? 'overview')
    }
  }, [visibleTabs, tab])

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
      setSiteAddressForm({
        site_address_line1: projectData.site_address_line1 ?? '',
        site_city: projectData.site_city ?? '',
        site_postal_code: projectData.site_postal_code ?? '',
      })

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
    if (field === 'budget' && !canEditBudget) {
      return
    }

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

  async function handleSiteAddressSave(event) {
    event.preventDefault()
    if (!canUpdate) {
      return
    }

    setSaving(true)
    try {
      const updated = await projectsApi.updateProject(id, {
        site_address_line1: siteAddressForm.site_address_line1.trim() || null,
        site_city: siteAddressForm.site_city.trim() || null,
        site_postal_code: siteAddressForm.site_postal_code.trim() || null,
      })
      const projectData = updated.data ?? updated
      setProject(projectData)
      setSiteAddressForm({
        site_address_line1: projectData.site_address_line1 ?? '',
        site_city: projectData.site_city ?? '',
        site_postal_code: projectData.site_postal_code ?? '',
      })

      const actor = resolveActorLabel(user, roles, t('layout.profileFallbackName'))
      logProjectUpdated({
        actor,
        title: projectData.title ?? project?.title ?? 'Projet',
        detail: `A mis à jour l'adresse du chantier du projet « ${projectData.title ?? project?.title ?? ''} »`,
      })

      if (projectData.latitude != null && projectData.longitude != null) {
        pushToast({
          action: 'creation',
          message: t('projects.overview.siteAddressGeocoded'),
        })
      } else {
        pushToast({
          action: 'modification',
          message: t('projects.overview.siteAddressGeocodeFailed'),
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

  function showTaskToast(action, message) {
    if (isAdmin) {
      return
    }

    pushToast({ action, message })
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
      showTaskToast('creation', t('projects.planning.taskAddedToast', { title: form.title.trim() }))
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
      showTaskToast('modification', t('projects.planning.taskUpdatedToast', { title: task.title }))
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
    const task = phases
      .flatMap((phase) => unwrapResource(phase.tasks))
      .find((item) => item.id === taskId)

    setSaving(true)
    setError('')
    try {
      await projectsApi.deleteTask(taskId)
      await loadProject()
      showTaskToast('suppression', t('projects.planning.taskDeletedToast', { title: task?.title ?? '' }))
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

  async function handleToggleMemberChat(member, nextValue) {
    const previous = Boolean(member.can_chat_with_client)
    setProject((current) => {
      if (!current) {
        return current
      }

      const members = unwrapResource(current.team_members).map((item) => (
        item.id === member.id
          ? { ...item, can_chat_with_client: nextValue }
          : item
      ))

      return { ...current, team_members: members }
    })

    try {
      const updated = await projectsApi.toggleTeamMemberChat(id, member.id, nextValue)
      setProject(updated.data ?? updated)
      pushToast({
        action: 'modification',
        message: nextValue
          ? t('projects.team.chatEnabledToast', { name: member.full_name })
          : t('projects.team.chatDisabledToast', { name: member.full_name }),
      })
    } catch (err) {
      setProject((current) => {
        if (!current) {
          return current
        }

        const members = unwrapResource(current.team_members).map((item) => (
          item.id === member.id
            ? { ...item, can_chat_with_client: previous }
            : item
        ))

        return { ...current, team_members: members }
      })
      pushToast({
        action: 'suppression',
        message: extractErrorMessage(err, t('projects.team.chatToggleError')),
      })
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
    return <p>{t('common.loading')}</p>
  }

  if (!project) {
    return (
      <div>
        <p className="error">{error || t('projects.notFound')}</p>
        <Link to="/projects">{t('nav.projects')}</Link>
      </div>
    )
  }

  const phases = unwrapResource(project.phases)
  const teamMembers = unwrapResource(project.team_members)
  const progressSnapshots = unwrapResource(project.progress_snapshots)

  return (
    <div>
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

      <div className="tabs">
        {visibleTabs.map((item) => (
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
              <select
                value={project.status}
                disabled={!canUpdate}
                onChange={(event) => handleProjectUpdate('status', event.target.value)}
              >
                <option value="draft">{t('status.draft')}</option>
                <option value="planned">{t('status.planned')}</option>
                <option value="in_progress">{t('status.in_progress')}</option>
                <option value="on_hold">{t('status.on_hold')}</option>
                <option value="completed">{t('status.completed')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
              </select>
            </label>
            <label>
              {t('projects.overview.budget')}
              <input
                type="number"
                min="0"
                step="0.01"
                defaultValue={project.budget ?? ''}
                disabled={!canEditBudget}
                onBlur={(event) => handleProjectUpdate('budget', event.target.value === '' ? null : Number(event.target.value))}
              />
              {project.revised_budget != null && Number(project.revised_budget) !== Number(project.budget ?? 0) ? (
                <span className="mt-1 block text-xs text-emerald-400">
                  {t('amendments.revisedHint', { value: formatMoney(project.revised_budget, locale) })}
                </span>
              ) : null}
            </label>
          </div>
          <p>{formatProjectOverviewDescription(project, t('projects.overview.noDescription'))}</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${project.progress_percent}%` }} />
          </div>
          <div className="mt-4 rounded-lg border border-slate-800/60 bg-[#0a0b0d]/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('projects.siteAddress')}
              </p>
              <span className={`text-xs ${project.latitude != null && project.longitude != null ? 'text-emerald-400' : 'text-slate-500'}`}>
                {project.latitude != null && project.longitude != null
                  ? t('projects.form.onMap')
                  : t('projects.form.notOnMap')}
              </span>
            </div>
            {canUpdate ? (
              <form className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleSiteAddressSave}>
                <label className="md:col-span-2">
                  {t('projects.form.siteAddressLine1')}
                  <input
                    value={siteAddressForm.site_address_line1}
                    onChange={(event) => setSiteAddressForm((current) => ({
                      ...current,
                      site_address_line1: event.target.value,
                    }))}
                    placeholder={t('projects.form.siteAddressLine1Placeholder')}
                  />
                </label>
                <label>
                  {t('projects.form.siteCity')}
                  <input
                    value={siteAddressForm.site_city}
                    onChange={(event) => setSiteAddressForm((current) => ({
                      ...current,
                      site_city: event.target.value,
                    }))}
                    placeholder={t('projects.form.siteCityPlaceholder')}
                  />
                </label>
                <label>
                  {t('projects.form.sitePostalCode')}
                  <input
                    value={siteAddressForm.site_postal_code}
                    onChange={(event) => setSiteAddressForm((current) => ({
                      ...current,
                      site_postal_code: event.target.value,
                    }))}
                    placeholder={t('projects.form.sitePostalCodePlaceholder')}
                  />
                </label>
                <div className="md:col-span-2">
                  <button type="submit" disabled={saving}>
                    {t('projects.overview.saveSiteAddress')}
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-2 hint">
                {project.site_address || project.site_address_line1 || t('projects.overview.noSiteAddress')}
                {project.site_city ? `, ${project.site_city}` : ''}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {tab === 'planning' ? (
        <section className="stack">
          {canManagePhases ? (
            <ProjectExcelImportPanel
              projectId={id}
              projectReference={project?.reference}
              onImported={() => loadProject()}
            />
          ) : null}
          {canManagePhases ? (
            <form className="inline-form card" onSubmit={handleAddPhase}>
              <input
                placeholder={t('projects.planning.newPhase')}
                value={phaseName}
                onChange={(event) => setPhaseName(event.target.value)}
              />
              <button type="submit" disabled={saving}>{t('projects.planning.addPhase')}</button>
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
                {canManagePhases ? (
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
                        {task.quantity != null && task.unit_price != null ? (
                          <span>
                            {task.quantity} {task.unit || 'u'} × {formatMoney(task.unit_price, locale)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {canManageProjectTask(task) ? (
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

              {canManagePhases ? (
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
                  <select
                    value={taskForms[phase.id]?.assigned_to_user_id ?? ''}
                    onChange={(event) => setTaskForms({
                      ...taskForms,
                      [phase.id]: {
                        ...(taskForms[phase.id] ?? { title: '' }),
                        assigned_to_user_id: event.target.value,
                      },
                    })}
                  >
                    <option value="">{t('projects.planning.unassigned')}</option>
                    {companyUsers.map((user) => (
                      <option key={user.id} value={user.id}>{user.full_name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => handleAddTask(phase.id)} disabled={saving}>
                    {t('projects.planning.addTask')}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {tab === 'team' ? (
        <section className="stack">
          {isAdmin ? (
            <form className="inline-form card" onSubmit={handleAddTeamMember}>
              <select
                value={teamForm.user_id}
                onChange={(event) => setTeamForm({ ...teamForm, user_id: event.target.value })}
                required
              >
                <option value="">{t('projects.team.selectUser')}</option>
                {companyUsers.map((user) => (
                  <option key={user.id} value={user.id}>{user.full_name}</option>
                ))}
              </select>
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
                  {isAdmin ? <th>{t('projects.team.chatWithClient')}</th> : null}
                  {isAdmin ? <th>{t('common.actions')}</th> : null}
                </tr>
              </thead>
              <tbody>
                {teamMembers.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 5 : 3}>{t('projects.team.empty')}</td></tr>
                ) : (
                  teamMembers.map((member) => (
                    <tr key={member.id}>
                      <td>{member.full_name}</td>
                      <td>{member.email}</td>
                      <td>{member.role_label || '—'}</td>
                      {isAdmin ? (
                        <td>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={Boolean(member.can_chat_with_client)}
                            aria-label={t('projects.team.chatWithClient')}
                            onClick={() => handleToggleMemberChat(member, !member.can_chat_with_client)}
                            className={[
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
                              member.can_chat_with_client ? 'bg-emerald-500/80' : 'bg-slate-700',
                            ].join(' ')}
                          >
                            <span
                              className={[
                                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                                member.can_chat_with_client ? 'translate-x-5' : 'translate-x-0.5',
                              ].join(' ')}
                            />
                          </button>
                          <span className="ml-2 text-xs text-slate-400">
                            {member.can_chat_with_client
                              ? t('projects.team.chatOn')
                              : t('projects.team.chatOff')}
                          </span>
                        </td>
                      ) : null}
                      {isAdmin ? (
                        <td>
                          <button type="button" className="ghost danger" onClick={() => handleRemoveTeamMember(member.id)}>
                            {t('projects.team.remove')}
                          </button>
                        </td>
                      ) : null}
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

      {tab === 'amendments' ? (
        <ProjectAmendmentsTab
          projectId={id}
          project={project}
          onProjectRefresh={() => loadProject()}
        />
      ) : null}
    </div>
  )
}
