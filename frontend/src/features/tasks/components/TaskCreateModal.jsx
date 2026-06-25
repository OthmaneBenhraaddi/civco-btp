import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from '../../../i18n/LanguageContext'
import * as projectsApi from '../../../api/projects'
import { unwrapResource } from '../../../utils/apiHelpers'
import { TASK_PRIORITES, TASK_STATUTS } from '../types'
import { buildAvatarUrl, createTaskId, formatLastUpdatedAt } from '../utils/taskUtils'

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
  const { user } = useAuth()
  const { t, locale } = useTranslation()
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
    const now = new Date()

    const task = {
      id: createTaskId(),
      projectId: String(selectedProject.id),
      projectName: selectedProject.title,
      nom: form.nom.trim(),
      responsable: {
        name: responsableName,
        avatarUrl: buildAvatarUrl(responsableName),
      },
      statut: form.statut,
      echeance: form.echeance,
      priorite: form.priorite,
      budget: form.budget === '' ? 0 : Number(form.budget),
      fichiers: fileNames,
      notes: form.notes.trim(),
      lastUpdatedBy: user?.full_name ?? responsableName,
      lastUpdatedAt: formatLastUpdatedAt(now, locale),
    }

    onCreated(task)
    setSaving(false)
    onClose()
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
              <select
                className="filter-select w-full"
                value={form.projectId}
                onChange={(event) => setForm({ ...form, projectId: event.target.value })}
                required
              >
                <option value="" disabled>{t('tasks.form.selectProject')}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
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
            <select
              className="filter-select w-full"
              value={form.responsableName}
              onChange={(event) => setForm({ ...form, responsableName: event.target.value })}
              required
            >
              {users.length === 0 ? (
                <option value={form.responsableName}>{form.responsableName || t('tasks.form.currentUser')}</option>
              ) : (
                users.map((companyUser) => (
                  <option key={companyUser.id} value={companyUser.full_name}>
                    {companyUser.full_name}
                  </option>
                ))
              )}
            </select>
          </label>

          <div className="form-row">
            <label>
              {t('tasks.columns.status')}
              <select
                className="filter-select w-full"
                value={form.statut}
                onChange={(event) => setForm({ ...form, statut: event.target.value })}
              >
                {TASK_STATUTS.map((statut) => (
                  <option key={statut} value={statut}>
                    {t(`tasks.statuses.${statut === 'en_cours' ? 'working' : statut === 'termine' ? 'done' : statut === 'bloque' ? 'stuck' : 'not_started'}`)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t('tasks.columns.priority')}
              <select
                className="filter-select w-full"
                value={form.priorite}
                onChange={(event) => setForm({ ...form, priorite: event.target.value })}
              >
                {TASK_PRIORITES.map((priorite) => (
                  <option key={priorite} value={priorite}>
                    {t(`tasks.priorities.${priorite === 'haute' ? 'high' : priorite === 'moyenne' ? 'medium' : 'low'}`)}
                  </option>
                ))}
              </select>
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
