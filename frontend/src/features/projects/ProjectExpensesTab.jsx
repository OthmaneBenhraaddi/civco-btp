import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as expensesApi from '../../api/expenses'
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

  return (
    <section className="stack">
      <article className="card kpi-card">
        <h3>{t('expenses.projectTotal')}</h3>
        <p className="kpi-value">{formatMoney(total, locale)}</p>
      </article>

      {canManage ? (
        <form className="card stack" onSubmit={handleSubmit}>
          <h3>{editing ? t('expenses.edit') : t('expenses.add')}</h3>
          <label>
            {t('expenses.label')} *
            <input
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
              required
            />
          </label>
          <div className="form-row">
            <label>
              {t('expenses.category')} *
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>{t(`expenses.categories.${item}`)}</option>
                ))}
              </select>
            </label>
            <label>
              {t('expenses.amount')} *
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
                required
              />
            </label>
            <label>
              {t('expenses.date')} *
              <input
                type="date"
                value={form.expense_date}
                onChange={(event) => setForm({ ...form, expense_date: event.target.value })}
                required
              />
            </label>
          </div>
          <label>
            {t('expenses.notes')}
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
          <div className="inline-form">
            <button type="submit" disabled={saving}>
              {saving ? t('common.saving') : editing ? t('expenses.update') : t('expenses.create')}
            </button>
            {editing ? (
              <button type="button" className="ghost" onClick={resetForm}>{t('common.cancel')}</button>
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
                        <>
                          <button type="button" className="ghost" onClick={() => openEdit(expense)}>
                            {t('common.edit')}
                          </button>
                          <button type="button" className="ghost danger" onClick={() => handleDelete(expense.id)}>
                            {t('common.delete')}
                          </button>
                        </>
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
