import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as expensesApi from '../../api/expenses'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import {
  BENTO_CARD_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
  PG_STAT_ACCENT_CLASS,
} from '../../theme/designTokens'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'
import { formatMoney } from '../../utils/currency'

const CATEGORIES = ['materials', 'labor', 'equipment', 'subcontractor', 'other']

const emptyForm = {
  label: '',
  category: 'materials',
  amount: '',
  expense_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function ProjectExpensesTab({ projectId }) {
  const { hasPermission } = useAuth()
  const { t, locale } = useTranslation()
  const canManage = hasPermission('expense.manage')

  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)

  async function loadExpenses() {
    setLoading(true)
    setError('')

    try {
      const data = await expensesApi.fetchProjectExpenses(projectId)
      setExpenses(unwrapResource(data.data ?? data))
    } catch (err) {
      setError(extractErrorMessage(err, t('expenses.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [projectId])

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0)

  function openEdit(expense) {
    setEditing(expense)
    setForm({
      label: expense.label,
      category: expense.category,
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      notes: expense.notes ?? '',
    })
  }

  function resetForm() {
    setEditing(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      amount: Number(form.amount),
    }

    try {
      if (editing) {
        await expensesApi.updateExpense(editing.id, payload)
      } else {
        await expensesApi.createExpense(projectId, payload)
      }

      resetForm()
      await loadExpenses()
    } catch (err) {
      setError(extractErrorMessage(err, t('expenses.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(expenseId) {
    if (!window.confirm(t('expenses.deleteConfirm'))) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await expensesApi.deleteExpense(expenseId)
      await loadExpenses()
    } catch (err) {
      setError(extractErrorMessage(err, t('expenses.deleteError')))
    } finally {
      setSaving(false)
    }
  }

  const categoryOptions = CATEGORIES.map((item) => ({
    value: item,
    label: t(`expenses.categories.${item}`),
  }))

  return (
    <section className="stack">
      <article className={`${PG_STAT_ACCENT_CLASS} p-5`}>
        <p className="pg-stat__label">{t('expenses.projectTotal')}</p>
        <p className="pg-stat__value">{formatMoney(total, locale)}</p>
      </article>

      {canManage ? (
        <form className={`${BENTO_CARD_CLASS} grid gap-4 p-5`} onSubmit={handleSubmit}>
          <h3 className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-white">
            {editing ? t('expenses.edit') : t('expenses.add')}
          </h3>

          <label>
            <span className={LABEL_CLASS}>{t('expenses.label')} *</span>
            <input
              className={FIELD_CLASS}
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
              required
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className={LABEL_CLASS}>{t('expenses.category')} *</span>
              <CutSelect
                className="mt-1 w-full"
                size="sm"
                value={form.category}
                onChange={(category) => setForm({ ...form, category })}
                options={categoryOptions}
              />
            </div>
            <label>
              <span className={LABEL_CLASS}>{t('expenses.amount')} *</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={FIELD_CLASS}
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                required
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>{t('expenses.date')} *</span>
              <input
                type="date"
                className={FIELD_CLASS}
                value={form.expense_date}
                onChange={(event) => setForm({ ...form, expense_date: event.target.value })}
                required
              />
            </label>
          </div>

          <label>
            <span className={LABEL_CLASS}>{t('expenses.notes')}</span>
            <textarea
              rows={2}
              className={FIELD_CLASS}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <NeonButton type="submit" size="sm" disabled={saving}>
              {saving ? t('common.saving') : editing ? t('expenses.update') : t('expenses.create')}
            </NeonButton>
            {editing ? (
              <NeonButton type="button" variant="ghost" size="sm" onClick={resetForm}>
                {t('common.cancel')}
              </NeonButton>
            ) : null}
          </div>
        </form>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('expenses.label')}</th>
                <th>{t('expenses.category')}</th>
                <th>{t('expenses.amount')}</th>
                <th>{t('expenses.date')}</th>
                <th>{t('expenses.recordedBy')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={6}>{t('expenses.empty')}</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.label}</td>
                    <td>{t(`expenses.categories.${expense.category}`)}</td>
                    <td>{formatMoney(expense.amount, locale)}</td>
                    <td>{expense.expense_date}</td>
                    <td>{expense.recorded_by?.full_name ?? '—'}</td>
                    <td className="actions">
                      {canManage ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(expense)}
                            aria-label={t('common.edit')}
                            title={t('common.edit')}
                            className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                          >
                            <Pencil className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(expense.id)}
                            aria-label={t('common.delete')}
                            title={t('common.delete')}
                            className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
