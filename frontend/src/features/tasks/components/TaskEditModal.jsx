import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import CutSelect from '../../../components/prodigy/CutSelect'
import { useAuth } from '../../../context/AuthContext'
import { useTranslation } from '../../../i18n/LanguageContext'
import * as projectsApi from '../../../api/projects'
import { unwrapResource } from '../../../utils/apiHelpers'
import { mapApiTaskToUiTask, UI_STATUS_TO_API } from '../utils/taskApiMappers'
import { canManageAllTasks } from '../utils/taskPermissions'
import { STATUT_I18N_KEY, TASK_STATUTS } from '../types'

export default function TaskEditModal({
  open,
  task,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const { user, isAdmin, hasPermission } = useAuth()
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    nom: '',
    statut: 'non_commence',
    echeance: '',
    notes: '',
    responsableName: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const manageAll = canManageAllTasks({ isAdmin, hasPermission })

  useEffect(() => {
    if (!open || !task) {
      return
    }

    setLoading(true)
    setError('')
    setForm({
      nom: task.nom ?? '',
      statut: task.statut ?? 'non_commence',
      echeance: task.echeance ?? '',
      notes: task.notes ?? '',
      responsableName: task.responsable?.name ?? user?.full_name ?? '',
    })

    projectsApi.fetchCompanyUsers()
      .then((response) => setUsers(unwrapResource(response.data ?? response)))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [open, task, user?.full_name])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!task) {
      return
    }

    setSaving(true)
    setError('')

    const assignedUser = users.find((companyUser) => companyUser.full_name === form.responsableName.trim())
    const payload = {
      title: form.nom.trim(),
      description: form.notes.trim() || null,
      status: UI_STATUS_TO_API[form.statut] ?? 'todo',
      due_date: form.echeance || null,
    }

    if (manageAll) {
      payload.assigned_to_user_id = assignedUser?.id ?? task.assignedToUserId ?? null
    }

    try {
      const response = await projectsApi.updateTask(task.id, payload)
      const apiTask = response?.data ?? response
      const project = { id: task.projectId, title: task.projectName }
      onUpdated?.(mapApiTaskToUiTask(apiTask, project))
      onClose()
    } catch {
      setError(t('tasks.edit.error'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!task || !window.confirm(t('tasks.deleteConfirm', { name: task.nom }))) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await projectsApi.deleteTask(task.id)
      onDeleted?.(task.id)
      onClose()
    } catch {
      setError(t('tasks.deleteError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('tasks.edit.title')} open={open} onClose={onClose}>
      {loading ? (
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      ) : (
        <form className="stack" onSubmit={handleSubmit}>
          {error ? <p className="error">{error}</p> : null}

          <label>
            {t('tasks.columns.name')} *
            <input
              value={form.nom}
              onChange={(event) => setForm({ ...form, nom: event.target.value })}
              required
            />
          </label>

          {manageAll ? (
            <label>
              {t('tasks.columns.owner')} *
              <CutSelect
                className="w-full"
                size="sm"
                value={form.responsableName}
                onChange={(next) => setForm({ ...form, responsableName: next })}
                required
                options={users.map((companyUser) => ({
                  value: companyUser.full_name,
                  label: companyUser.full_name,
                }))}
              />
            </label>
          ) : (
            <p className="text-sm text-slate-400">
              {t('tasks.columns.owner')}: {form.responsableName}
            </p>
          )}

          <label>
            {t('tasks.columns.status')}
            <CutSelect
              className="w-full"
              size="sm"
              value={form.statut}
              onChange={(next) => setForm({ ...form, statut: next })}
              options={TASK_STATUTS.map((statut) => ({
                value: statut,
                label: t(`tasks.statuses.${STATUT_I18N_KEY[statut]}`),
              }))}
            />
          </label>

          <label>
            {t('tasks.columns.dueDate')}
            <input
              type="date"
              value={form.echeance}
              onChange={(event) => setForm({ ...form, echeance: event.target.value })}
            />
          </label>

          <label>
            {t('tasks.columns.notes')}
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving}>
              {saving ? t('common.saving') : t('tasks.edit.save')}
            </button>
            <button type="button" className="ghost danger" disabled={saving} onClick={handleDelete}>
              {t('common.delete')}
            </button>
            <button type="button" className="ghost" disabled={saving} onClick={onClose}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
