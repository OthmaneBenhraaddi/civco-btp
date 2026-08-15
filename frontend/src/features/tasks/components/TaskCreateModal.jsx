import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import CutSelect from '../../../components/prodigy/CutSelect'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from '../../../i18n/LanguageContext'
import * as projectsApi from '../../../api/projects'
import { unwrapResource } from '../../../utils/apiHelpers'
import { mapApiTaskToUiTask, UI_STATUS_TO_API } from '../utils/taskApiMappers'
import { canManageAllTasks } from '../utils/taskPermissions'
import { TASK_PRIORITES, TASK_STATUTS } from '../types'

const emptyForm = {
  projectId: '',
  nom: '',
  responsableName: '',
  statut: 'non_commence',
  priorite: 'moyenne',
  echeance: '',
  budget: '',
  notes: '',
}

export default function TaskCreateModal({
  open,
  onClose,
  onCreated,
  defaultProjectId = null,
  defaultProjectName = '',
}) {
  const { user, isAdmin, hasPermission } = useAuth()
  const manageAll = canManageAllTasks({ isAdmin, hasPermission })
  const { t } = useTranslation()
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [fileNames, setFileNames] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const lockedProjectId = defaultProjectId ? String(defaultProjectId) : null

  useEffect(() => {
    if (!open) {
      return
    }

    setLoading(true)

    Promise.all([
      projectsApi.fetchProjects({ per_page: 100 }),
      projectsApi.fetchCompanyUsers(),
    ])
      .then(([projectResponse, companyUsersResponse]) => {
        const projectList = projectResponse.data ?? []
        const companyUsers = unwrapResource(companyUsersResponse.data ?? companyUsersResponse)
        setProjects(projectList)
        setUsers(companyUsers)

        const defaultUserName = user?.full_name ?? companyUsers?.[0]?.full_name ?? ''
        const projectId = lockedProjectId
          ?? (projectList[0]?.id ? String(projectList[0].id) : '')

        setForm({
          ...emptyForm,
          projectId,
          responsableName: defaultUserName,
        })
        setFileNames([])
      })
      .catch(() => {
        setProjects([])
        setUsers([])
        setForm({
          ...emptyForm,
          projectId: lockedProjectId ?? '',
          responsableName: user?.full_name ?? '',
        })
        setFileNames([])
      })
      .finally(() => setLoading(false))
  }, [open, user?.full_name, lockedProjectId])

  function handleFileChange(event) {
    const names = Array.from(event.target.files ?? []).map((file) => file.name)
    setFileNames(names)
  }

  function handleSubmit(event) {
    event.preventDefault()

    const projectId = lockedProjectId ?? form.projectId
    const selectedProject = projects.find((project) => String(project.id) === String(projectId))
      ?? (lockedProjectId && defaultProjectName
        ? { id: lockedProjectId, title: defaultProjectName }
        : null)

    if (!selectedProject) {
      return
    }

    setSaving(true)

    const responsableName = form.responsableName.trim()
    const assignedUser = users.find((companyUser) => companyUser.full_name === responsableName)

    projectsApi.fetchProjectPhases(selectedProject.id)
      .then((phaseResponse) => {
        const phases = unwrapResource(phaseResponse)
        const targetPhase = phases[0]

        if (!targetPhase) {
          throw new Error('No phase')
        }

        return projectsApi.createTask(targetPhase.id, {
          title: form.nom.trim(),
          description: form.notes.trim() || null,
          status: UI_STATUS_TO_API[form.statut] ?? 'todo',
          assigned_to_user_id: assignedUser?.id ?? null,
          due_date: form.echeance || null,
        })
      })
      .then((response) => {
        const apiTask = response?.data ?? response
        const task = mapApiTaskToUiTask(apiTask, selectedProject)
        onCreated(task)
        onClose()
      })
      .catch(() => {
        // Keep modal open on failure
      })
      .finally(() => setSaving(false))
  }

  return (
    <Modal title={t('tasks.form.title')} open={open} onClose={onClose}>
      {loading ? (
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      ) : (
        <form className="stack" onSubmit={handleSubmit}>
          {lockedProjectId ? (
            <div className="rounded-lg border border-slate-800/60 bg-[#0a0b0d]/60 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {t('tasks.form.project')}
              </p>
              <p className="mt-1 text-sm font-medium text-white">{defaultProjectName}</p>
              <input type="hidden" value={lockedProjectId} readOnly />
            </div>
          ) : (
            <label>
              {t('tasks.form.project')} *
              <CutSelect
                className="w-full"
                size="sm"
                value={form.projectId}
                onChange={(next) => setForm({ ...form, projectId: next })}
                required
                placeholder={t('tasks.form.selectProject')}
                options={[
                  { value: '', label: t('tasks.form.selectProject') },
                  ...projects.map((project) => ({
                    value: project.id,
                    label: project.title,
                  })),
                ]}
              />
            </label>
          )}

          <label>
            {t('tasks.columns.name')} *
            <input
              value={form.nom}
              onChange={(event) => setForm({ ...form, nom: event.target.value })}
              required
            />
          </label>

          <label>
            {t('tasks.columns.owner')} *
            {manageAll ? (
              <CutSelect
                className="w-full"
                size="sm"
                value={form.responsableName}
                onChange={(next) => setForm({ ...form, responsableName: next })}
                required
                options={
                  users.length === 0
                    ? [{
                      value: form.responsableName,
                      label: form.responsableName || t('tasks.form.currentUser'),
                    }]
                    : users.map((companyUser) => ({
                      value: companyUser.full_name,
                      label: companyUser.full_name,
                    }))
                }
              />
            ) : (
              <p className="mt-1 text-sm text-slate-300">{form.responsableName || user?.full_name}</p>
            )}
          </label>

          <div className="form-row">
            <label>
              {t('tasks.columns.status')}
              <CutSelect
                className="w-full"
                size="sm"
                value={form.statut}
                onChange={(next) => setForm({ ...form, statut: next })}
                options={TASK_STATUTS.map((statut) => ({
                  value: statut,
                  label: t(`tasks.statuses.${statut === 'en_cours' ? 'working' : statut === 'termine' ? 'done' : statut === 'bloque' ? 'stuck' : 'not_started'}`),
                }))}
              />
            </label>

            <label>
              {t('tasks.columns.priority')}
              <CutSelect
                className="w-full"
                size="sm"
                value={form.priorite}
                onChange={(next) => setForm({ ...form, priorite: next })}
                options={TASK_PRIORITES.map((priorite) => ({
                  value: priorite,
                  label: t(`tasks.priorities.${priorite === 'haute' ? 'high' : priorite === 'moyenne' ? 'medium' : 'low'}`),
                }))}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              {t('tasks.columns.dueDate')} *
              <input
                type="date"
                value={form.echeance}
                onChange={(event) => setForm({ ...form, echeance: event.target.value })}
                required
              />
            </label>

            <label>
              {t('tasks.columns.budget')}
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(event) => setForm({ ...form, budget: event.target.value })}
              />
            </label>
          </div>

          <label>
            {t('tasks.columns.notes')}
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>

          <label>
            {t('tasks.columns.files')}
            <input type="file" multiple onChange={handleFileChange} className="task-file-input" />
            {fileNames.length > 0 ? (
              <span className="mt-1 block text-xs text-slate-400">
                {fileNames.join(', ')}
              </span>
            ) : null}
          </label>

          <button type="submit" disabled={saving || (!lockedProjectId && projects.length === 0)}>
            {saving ? t('common.saving') : t('tasks.form.create')}
          </button>
        </form>
      )}
    </Modal>
  )
}
