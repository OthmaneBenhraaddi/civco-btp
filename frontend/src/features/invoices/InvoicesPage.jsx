import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import CutSelect from '../../components/prodigy/CutSelect'
import { useAuth } from '../../context/AuthContext'
import { useStealthMode, useStealthModeRefresh } from '../../context/StealthModeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { resolveNavPath } from '../../routes/routeAccess'
import * as clientsApi from '../../api/clients'
import * as dispatchNotesApi from '../../api/dispatchNotes'
import * as invoicesApi from '../../api/invoices'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatMoney } from '../../utils/currency'
import { filterOfficialClients, filterOfficialLinkedRecords } from '../../utils/stealthVisibility'
import {
  logInvoiceCreated,
  logInvoiceDeleted,
  resolveActorLabel,
} from '../history/auditLogActions'

const emptyForm = {
  client_id: '',
  dispatch_note_id: '',
  issued_at: '',
  due_date: '',
  notes: '',
}

export default function InvoicesPage() {
  const { hasPermission, user, roles } = useAuth()
  const { stealthMode } = useStealthMode()
  const stealthModeRef = useRef(stealthMode)
  stealthModeRef.current = stealthMode
  const { t, locale } = useTranslation()
  const [invoices, setInvoices] = useState([])
  const invoicesBaselineRef = useRef([])
  const [clients, setClients] = useState([])
  const clientsBaselineRef = useRef([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [dispatchNotes, setDispatchNotes] = useState([])

  async function loadInvoices(page = 1, { silent = false } = {}) {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const data = await invoicesApi.fetchInvoices({
        search,
        status: statusFilter || undefined,
        page,
      })
      const list = data.data ?? []
      setInvoices(list)
      setMeta(data.meta ?? null)

      if (!stealthModeRef.current) {
        invoicesBaselineRef.current = list
      }
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('invoices.loadError')))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [search, statusFilter])

  useEffect(() => {
    clientsApi.fetchClients({ per_page: 100 })
      .then((data) => {
        const list = data.data ?? []
        setClients(list)
        if (!stealthModeRef.current) {
          clientsBaselineRef.current = list
        }
      })
      .catch(() => setClients([]))
  }, [])

  useStealthModeRefresh(({ active }) => {
    if (!active) {
      if (invoicesBaselineRef.current.length > 0) {
        setInvoices(invoicesBaselineRef.current)
      }
      if (clientsBaselineRef.current.length > 0) {
        setClients(clientsBaselineRef.current)
      }
      loadInvoices(meta?.current_page ?? 1, { silent: true })
    }
  })

  const visibleInvoices = useMemo(
    () => (stealthMode ? filterOfficialLinkedRecords(invoices) : invoices),
    [invoices, stealthMode],
  )

  const visibleClients = useMemo(
    () => (stealthMode ? filterOfficialClients(clients) : clients),
    [clients, stealthMode],
  )

  useEffect(() => {
    if (!form.client_id) {
      setDispatchNotes([])
      return
    }

    dispatchNotesApi.fetchDispatchNotes({
      client_id: Number(form.client_id),
      status: 'executed',
      per_page: 50,
    })
      .then((data) => setDispatchNotes(data.data ?? []))
      .catch(() => setDispatchNotes([]))
  }, [form.client_id])

  function openCreate() {
    setForm({
      ...emptyForm,
      client_id: visibleClients[0]?.id ? String(visibleClients[0].id) : '',
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
        dispatch_note_id: Number(form.dispatch_note_id),
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
          <button type="button" onClick={openCreate} disabled={visibleClients.length === 0}>
            {t('invoices.new')}
          </button>
        </PermissionGate>
      </header>

      {visibleClients.length === 0 ? (
        <p className="hint">{t('invoices.needClient')}</p>
      ) : null}

      <div className="toolbar">
        <SearchInput
          placeholder={t('invoices.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <CutSelect
          className="min-w-[180px]"
          size="sm"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: t('invoices.allStatuses') },
            { value: 'draft', label: t('status.draft') },
            { value: 'sent', label: t('status.sent') },
            { value: 'partially_paid', label: t('status.partially_paid') },
            { value: 'paid', label: t('status.paid') },
            { value: 'overdue', label: t('status.overdue') },
            { value: 'cancelled', label: t('status.cancelled') },
          ]}
        />
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
              {visibleInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>{t('invoices.empty')}</td>
                </tr>
              ) : (
                visibleInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link to={resolveNavPath(`/invoices/${invoice.id}`, user)}>{invoice.reference}</Link>
                    </td>
                    <td>{invoice.client?.name ?? '—'}</td>
                    <td><StatusBadge status={invoice.status} /></td>
                    <td>{formatMoney(invoice.total_ttc, locale)}</td>
                    <td>{formatMoney(invoice.balance_due, locale)}</td>
                    <td>{invoice.due_date ?? '—'}</td>
                    <td className="actions">
                      <Link to={resolveNavPath(`/invoices/${invoice.id}`, user)} className="btn-action">{t('invoices.open')}</Link>
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
          <div>
            <span>{t('invoices.client')} *</span>
            <CutSelect
              value={form.client_id}
              onChange={(client_id) => setForm({
                ...form,
                client_id,
                dispatch_note_id: '',
              })}
              required
              options={[
                { value: '', label: t('invoices.selectClient') },
                ...visibleClients.map((client) => ({
                  value: String(client.id),
                  label: client.name,
                })),
              ]}
            />
          </div>
          <div>
            <span>{t('dispatchNotes.selectExecuted')} *</span>
            <CutSelect
              value={form.dispatch_note_id}
              onChange={(dispatch_note_id) => setForm({ ...form, dispatch_note_id })}
              required
              disabled={!form.client_id || dispatchNotes.length === 0}
              options={[
                { value: '', label: t('dispatchNotes.selectExecuted') },
                ...dispatchNotes.map((note) => ({
                  value: String(note.id),
                  label: `${note.reference_number} — ${note.delivery_forms_count ?? 0} BL`,
                })),
              ]}
            />
            {form.client_id && dispatchNotes.length === 0 ? (
              <span className="hint">{t('dispatchNotes.noneForClient')}</span>
            ) : null}
          </div>
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
