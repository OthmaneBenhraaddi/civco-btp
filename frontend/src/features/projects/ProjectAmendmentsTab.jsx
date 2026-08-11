import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as amendmentsApi from '../../api/amendments'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'
import { formatMoney } from '../../utils/currency'
import { BTN_PRIMARY, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'

const TYPES = ['budget', 'duration', 'scope', 'mixed']

const emptyForm = {
  title: '',
  type: 'budget',
  amount_change: '',
  duration_change_days: '',
  description: '',
  file: null,
}

const STATUS_CLASS = {
  draft: 'bg-slate-500/15 text-slate-300',
  pending_client: 'bg-amber-500/15 text-amber-300',
  validated: 'bg-emerald-500/15 text-emerald-300',
  refused: 'bg-rose-500/15 text-rose-300',
}

function formatSignedMoney(value, locale) {
  const amount = Number(value) || 0
  const formatted = formatMoney(Math.abs(amount), locale)
  if (amount > 0) return `+${formatted}`
  if (amount < 0) return `-${formatted}`
  return formatted
}

function formatSignedDays(value, t) {
  const days = Number(value) || 0
  if (days > 0) return t('amendments.daysPlus', { days })
  if (days < 0) return t('amendments.daysMinus', { days: Math.abs(days) })
  return t('amendments.daysZero')
}

function StatusBadge({ status, t }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[status] ?? STATUS_CLASS.draft}`}>
      {t(`amendments.statuses.${status}`)}
    </span>
  )
}

export default function ProjectAmendmentsTab({ projectId, project, onProjectRefresh }) {
  const { hasPermission } = useAuth()
  const { t, locale } = useTranslation()
  const { pushToast } = useToast()
  const canManage = hasPermission('project.update')

  const [amendments, setAmendments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  async function loadAmendments() {
    setLoading(true)
    setError('')

    try {
      const data = await amendmentsApi.fetchProjectAmendments(projectId)
      setAmendments(unwrapResource(data.data ?? data))
    } catch (err) {
      setError(extractErrorMessage(err, t('amendments.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAmendments()
  }, [projectId])

  const summary = useMemo(() => {
    const initialBudget = project?.budget != null ? Number(project.budget) : null
    const totalBudget = project?.revised_budget != null
      ? Number(project.revised_budget)
      : project?.total_budget != null
        ? Number(project.total_budget)
        : initialBudget
    const amountDelta = project?.amendments_amount_delta != null
      ? Number(project.amendments_amount_delta)
      : amendments
        .filter((item) => item.status === 'validated')
        .reduce((sum, item) => sum + Number(item.amount_change || 0), 0)
    const durationDelta = project?.amendments_duration_delta != null
      ? Number(project.amendments_duration_delta)
      : amendments
        .filter((item) => item.status === 'validated')
        .reduce((sum, item) => sum + Number(item.duration_change_days || 0), 0)

    return {
      initialBudget,
      totalBudget,
      amountDelta,
      initialEndDate: project?.end_date ?? null,
      adjustedEndDate: project?.revised_end_date ?? project?.adjusted_end_date ?? project?.end_date ?? null,
      durationDelta,
    }
  }, [project, amendments])

  function openCreate() {
    setForm(emptyForm)
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('title', form.title.trim())
      formData.append('type', form.type)
      formData.append('amount_change', form.amount_change === '' ? '0' : String(form.amount_change))
      formData.append(
        'duration_change_days',
        form.duration_change_days === '' ? '0' : String(form.duration_change_days),
      )
      if (form.description.trim()) {
        formData.append('description', form.description.trim())
      }
      if (form.file) {
        formData.append('file', form.file)
      }

      await amendmentsApi.createAmendment(projectId, formData)
      setModalOpen(false)
      setForm(emptyForm)
      await loadAmendments()
      await onProjectRefresh?.()
      pushToast({
        action: 'creation',
        message: t('amendments.createSuccess'),
      })
    } catch (err) {
      setError(extractErrorMessage(err, t('amendments.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleStatus(amendment, status) {
    try {
      await amendmentsApi.updateAmendmentStatus(amendment.id, status)
      await loadAmendments()
      await onProjectRefresh?.()
      pushToast({
        action: 'modification',
        message: t('amendments.statusSuccess'),
      })
    } catch (err) {
      setError(extractErrorMessage(err, t('amendments.statusError')))
    }
  }

  async function handleDelete(amendment) {
    if (!window.confirm(t('amendments.deleteConfirm', { title: amendment.title }))) {
      return
    }

    try {
      await amendmentsApi.deleteAmendment(amendment.id)
      await loadAmendments()
      await onProjectRefresh?.()
      pushToast({
        action: 'suppression',
        message: t('amendments.deleteSuccess'),
      })
    } catch (err) {
      setError(extractErrorMessage(err, t('amendments.deleteError')))
    }
  }

  async function handleDownload(amendment) {
    try {
      await amendmentsApi.downloadAmendment(
        amendment.id,
        amendment.original_filename || 'avenant.pdf',
      )
    } catch (err) {
      setError(extractErrorMessage(err, t('amendments.downloadError')))
    }
  }

  return (
    <section className="stack space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-[#16171b] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t('amendments.initialBudget')}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {summary.initialBudget == null ? '—' : formatMoney(summary.initialBudget, locale)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/80">
            {t('amendments.currentBudget')}
          </p>
          <p className="mt-2 text-lg font-semibold text-emerald-300">
            {summary.totalBudget == null ? '—' : formatMoney(summary.totalBudget, locale)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatSignedMoney(summary.amountDelta, locale)}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-[#16171b] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {t('amendments.initialEndDate')}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">
            {summary.initialEndDate || '—'}
          </p>
        </div>
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-400/80">
            {t('amendments.adjustedEndDate')}
          </p>
          <p className="mt-2 text-lg font-semibold text-sky-300">
            {summary.adjustedEndDate || '—'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatSignedDays(summary.durationDelta, t)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('amendments.listTitle')}</h3>
          <p className="text-xs text-slate-500">{t('amendments.listSubtitle')}</p>
        </div>
        {canManage ? (
          <button type="button" className={BTN_PRIMARY} onClick={openCreate}>
            {t('amendments.add')}
          </button>
        ) : null}
      </div>

      {error ? <p className="error text-sm text-red-400">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('amendments.title')}</th>
                <th>{t('amendments.type')}</th>
                <th>{t('amendments.status')}</th>
                <th>{t('amendments.amountChange')}</th>
                <th>{t('amendments.durationChange')}</th>
                <th>{t('amendments.file')}</th>
                {canManage ? <th>{t('common.actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {amendments.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 7 : 6}>{t('amendments.empty')}</td>
                </tr>
              ) : (
                amendments.map((amendment) => (
                  <tr key={amendment.id}>
                    <td>
                      <div className="font-medium text-white">{amendment.title}</div>
                      {amendment.description ? (
                        <div className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                          {amendment.description}
                        </div>
                      ) : null}
                    </td>
                    <td>{t(`amendments.types.${amendment.type}`)}</td>
                    <td><StatusBadge status={amendment.status} t={t} /></td>
                    <td>{formatSignedMoney(amendment.amount_change, locale)}</td>
                    <td>{formatSignedDays(amendment.duration_change_days, t)}</td>
                    <td>
                      {amendment.has_file ? (
                        <button
                          type="button"
                          className="btn-action"
                          onClick={() => handleDownload(amendment)}
                        >
                          {t('amendments.download')}
                        </button>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    {canManage ? (
                      <td>
                        <div className="flex flex-wrap gap-2">
                          {amendment.status === 'draft' ? (
                            <>
                              <button
                                type="button"
                                className="btn-action"
                                onClick={() => handleStatus(amendment, 'pending_client')}
                              >
                                {t('amendments.submitClient')}
                              </button>
                              <button
                                type="button"
                                className="btn-action"
                                onClick={() => handleStatus(amendment, 'validated')}
                              >
                                {t('amendments.validate')}
                              </button>
                              <button
                                type="button"
                                className="ghost danger"
                                onClick={() => handleDelete(amendment)}
                              >
                                {t('common.delete')}
                              </button>
                            </>
                          ) : null}
                          {amendment.status === 'pending_client' ? (
                            <>
                              <button
                                type="button"
                                className="btn-action"
                                onClick={() => handleStatus(amendment, 'validated')}
                              >
                                {t('amendments.validate')}
                              </button>
                              <button
                                type="button"
                                className="ghost danger"
                                onClick={() => handleStatus(amendment, 'refused')}
                              >
                                {t('amendments.refuse')}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={t('amendments.add')}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label>
            <span className={LABEL_CLASS}>{t('amendments.title')} *</span>
            <input
              className={FIELD_CLASS}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
              placeholder={t('amendments.titlePlaceholder')}
            />
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('amendments.type')}</span>
            <select
              className={FIELD_CLASS}
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`amendments.types.${type}`)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={LABEL_CLASS}>{t('amendments.amountChange')}</span>
              <input
                type="number"
                step="0.01"
                className={FIELD_CLASS}
                value={form.amount_change}
                onChange={(event) => setForm({ ...form, amount_change: event.target.value })}
                placeholder="+50000 ou -10000"
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>{t('amendments.durationChange')}</span>
              <input
                type="number"
                step="1"
                className={FIELD_CLASS}
                value={form.duration_change_days}
                onChange={(event) => setForm({ ...form, duration_change_days: event.target.value })}
                placeholder="+30"
              />
            </label>
          </div>

          <label>
            <span className={LABEL_CLASS}>{t('amendments.description')}</span>
            <textarea
              rows={3}
              className={FIELD_CLASS}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder={t('amendments.descriptionPlaceholder')}
            />
          </label>

          <label>
            <span className={LABEL_CLASS}>{t('amendments.file')}</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="mt-1 block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-sm file:text-white"
              onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null })}
            />
            <span className="mt-1 block text-xs text-slate-500">{t('amendments.fileHint')}</span>
          </label>

          <button type="submit" disabled={saving} className={BTN_PRIMARY}>
            {saving ? t('common.saving') : t('amendments.create')}
          </button>
        </form>
      </Modal>
    </section>
  )
}
