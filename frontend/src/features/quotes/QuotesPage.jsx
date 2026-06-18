import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import SearchInput from '../../components/SearchInput'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as clientsApi from '../../api/clients'
import * as quotesApi from '../../api/quotes'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatMoney } from '../../utils/currency'
import {
  logQuoteCreated,
  logQuoteDeleted,
  resolveActorLabel,
} from '../history/auditLogActions'

const emptyForm = {
  client_id: '',
  project_id: '',
  issued_at: '',
  valid_until: '',
  notes: '',
}

export default function QuotesPage() {
  const { hasPermission, user, roles } = useAuth()
  const { t, locale } = useTranslation()
  const [quotes, setQuotes] = useState([])
  const [clients, setClients] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  async function loadQuotes(page = 1) {
    setLoading(true)
    setError('')

    try {
      const data = await quotesApi.fetchQuotes({
        search,
        status: statusFilter || undefined,
        page,
      })
      setQuotes(data.data ?? [])
      setMeta(data.meta ?? null)
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
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
      const created = await quotesApi.createQuote({
        client_id: Number(form.client_id),
        project_id: form.project_id ? Number(form.project_id) : null,
        issued_at: form.issued_at || null,
        valid_until: form.valid_until || null,
        notes: form.notes || null,
      })
      const client = clients.find((item) => item.id === Number(form.client_id))
      logQuoteCreated({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        clientName: client?.name ?? '—',
        reference: created?.reference ?? created?.data?.reference,
      })
      setModalOpen(false)
      await loadQuotes()
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.createError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(quote) {
    if (!window.confirm(t('quotes.deleteConfirm', { reference: quote.reference }))) {
      return
    }

    try {
      await quotesApi.deleteQuote(quote.id)
      logQuoteDeleted({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        reference: quote.reference,
      })
      await loadQuotes(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('quotes.deleteError')))
    }
  }

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('quotes.title')}</h1>
          <p>{t('quotes.subtitle')}</p>
        </div>
        <PermissionGate permission="quote.manage">
          <button type="button" onClick={openCreate} disabled={clients.length === 0}>
            {t('quotes.new')}
          </button>
        </PermissionGate>
      </header>

      {clients.length === 0 ? (
        <p className="hint">{t('quotes.needClient')}</p>
      ) : null}

      <div className="toolbar">
        <SearchInput
          placeholder={t('quotes.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">{t('quotes.allStatuses')}</option>
          <option value="draft">{t('status.draft')}</option>
          <option value="sent">{t('status.sent')}</option>
          <option value="accepted">{t('status.accepted')}</option>
          <option value="rejected">{t('status.rejected')}</option>
          <option value="expired">{t('status.expired')}</option>
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
                <th>{t('quotes.reference')}</th>
                <th>{t('quotes.client')}</th>
                <th>{t('quotes.status')}</th>
                <th>{t('quotes.totalTtc')}</th>
                <th>{t('quotes.issuedAt')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={6}>{t('quotes.empty')}</td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id}>
                    <td>
                      <Link to={`/quotes/${quote.id}`}>{quote.reference}</Link>
                    </td>
                    <td>{quote.client?.name ?? '—'}</td>
                    <td><StatusBadge status={quote.status} /></td>
                    <td>{formatMoney(quote.total_ttc, locale)}</td>
                    <td>{quote.issued_at ?? '—'}</td>
                    <td className="actions">
                      <Link to={`/quotes/${quote.id}`} className="btn-action">{t('quotes.open')}</Link>
                      {hasPermission('quote.manage') && quote.status === 'draft' ? (
                        <button type="button" className="ghost danger" onClick={() => handleDelete(quote)}>
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

      <Modal title={t('quotes.new')} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            {t('quotes.client')} *
            <select
              value={form.client_id}
              onChange={(event) => setForm({ ...form, client_id: event.target.value })}
              required
            >
              <option value="">{t('quotes.selectClient')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              {t('quotes.issuedAt')}
              <input
                type="date"
                value={form.issued_at}
                onChange={(event) => setForm({ ...form, issued_at: event.target.value })}
              />
            </label>
            <label>
              {t('quotes.validUntil')}
              <input
                type="date"
                value={form.valid_until}
                onChange={(event) => setForm({ ...form, valid_until: event.target.value })}
              />
            </label>
          </div>
          <label>
            {t('quotes.notes')}
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? t('quotes.creating') : t('quotes.create')}
          </button>
        </form>
      </Modal>
    </div>
  )
}
