import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as clientsApi from '../../api/clients'
import * as invoicesApi from '../../api/invoices'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatMoney } from '../../utils/currency'
import {
  logInvoiceCreated,
  logInvoiceDeleted,
  resolveActorLabel,
} from '../history/auditLogActions'

const emptyForm = {
  client_id: '',
  issued_at: '',
  due_date: '',
  notes: '',
}

export default function InvoicesPage() {
  const { hasPermission, user, roles } = useAuth()
  const { t, locale } = useTranslation()
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadInvoices(page = 1) {
    setLoading(true)
    setError('')

    try {
      const data = await invoicesApi.fetchInvoices({
        search,
        status: statusFilter || undefined,
        page,
      })
      setInvoices(data.data ?? [])
      setMeta(data.meta ?? null)
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [search, statusFilter])

  useEffect(() => {
    clientsApi.fetchClients({ per_page: 100, is_active: true })
      .then((data) => setClients(data.data ?? []))
      .catch(() => setClients([]))
  }, [])

  function openCreate() {
    setForm({
      ...emptyForm,
      client_id: clients[0]?.id ? String(clients[0].id) : '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const created = await invoicesApi.createInvoice({
        client_id: Number(form.client_id),
        issued_at: form.issued_at || null,
        due_date: form.due_date || null,
        notes: form.notes || null,
      })
      const client = clients.find((item) => item.id === Number(form.client_id))
      const amount = created?.total ?? created?.grand_total ?? created?.amount ?? 0
      logInvoiceCreated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        clientName: client?.name ?? '—',
        amountLabel: formatMoney(amount, locale),
      })
      setModalOpen(false)
      await loadInvoices()
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.createError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(invoice) {
    if (!window.confirm(t('invoices.deleteConfirm', { reference: invoice.reference }))) {
      return
    }

    try {
      await invoicesApi.deleteInvoice(invoice.id)
      logInvoiceDeleted({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: invoice.reference,
      })
      await loadInvoices(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('invoices.deleteError')))
    }
  }

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('invoices.title')}</h1>
          <p>{t('invoices.subtitle')}</p>
        </div>
        <PermissionGate permission="invoice.manage">
          <button type="button" onClick={openCreate} disabled={clients.length === 0}>
            {t('invoices.new')}
          </button>
        </PermissionGate>
      </header>

      {clients.length === 0 ? (
        <p className="hint">{t('invoices.needClient')}</p>
      ) : null}

      <div className="toolbar">
        <SearchInput
          placeholder={t('invoices.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">{t('invoices.allStatuses')}</option>
          <option value="draft">{t('status.draft')}</option>
          <option value="sent">{t('status.sent')}</option>
          <option value="partially_paid">{t('status.partially_paid')}</option>
          <option value="paid">{t('status.paid')}</option>
          <option value="overdue">{t('status.overdue')}</option>
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
                <th>{t('invoices.reference')}</th>
                <th>{t('invoices.client')}</th>
                <th>{t('invoices.status')}</th>
                <th>{t('invoices.totalTtc')}</th>
                <th>{t('invoices.balanceDue')}</th>
                <th>{t('invoices.dueDate')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>{t('invoices.empty')}</td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link to={`/invoices/${invoice.id}`}>{invoice.reference}</Link>
                    </td>
                    <td>{invoice.client?.name ?? '—'}</td>
                    <td><StatusBadge status={invoice.status} /></td>
                    <td>{formatMoney(invoice.total_ttc, locale)}</td>
                    <td>{formatMoney(invoice.balance_due, locale)}</td>
                    <td>{invoice.due_date ?? '—'}</td>
                    <td className="actions">
                      <Link to={`/invoices/${invoice.id}`} className="btn-action">{t('invoices.open')}</Link>
                      {hasPermission('invoice.manage') && invoice.status === 'draft' ? (
                        <button type="button" className="ghost danger" onClick={() => handleDelete(invoice)}>
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

      <Modal title={t('invoices.new')} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            {t('invoices.client')} *
            <select
              value={form.client_id}
              onChange={(event) => setForm({ ...form, client_id: event.target.value })}
              required
            >
              <option value="">{t('invoices.selectClient')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              {t('invoices.issuedAt')}
              <input
                type="date"
                value={form.issued_at}
                onChange={(event) => setForm({ ...form, issued_at: event.target.value })}
              />
            </label>
            <label>
              {t('invoices.dueDate')}
              <input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
              />
            </label>
          </div>
          <label>
            {t('invoices.notes')}
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? t('invoices.creating') : t('invoices.create')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
