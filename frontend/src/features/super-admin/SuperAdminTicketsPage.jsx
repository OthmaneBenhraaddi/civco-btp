import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as superAdminApi from '../../api/superAdmin'
import * as cmsTicketsApi from '../../api/superAdminTickets'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useTranslation } from '../../i18n/LanguageContext'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../tickets/ticketsData'
import SuperAdminPageHeader from './components/SuperAdminPageHeader'

export default function SuperAdminTicketsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [targetAdminId, setTargetAdminId] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Autre')
  const [priority, setPriority] = useState('high')
  const [body, setBody] = useState('')

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => String(tenant.id) === String(tenantId)) ?? null,
    [tenants, tenantId],
  )

  const admins = selectedTenant?.admins ?? []

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [ticketResponse, tenantResponse] = await Promise.all([
          cmsTicketsApi.fetchCmsTickets(),
          superAdminApi.fetchTenants(),
        ])
        if (cancelled) return
        setTickets(ticketResponse.data ?? [])
        setTenants(tenantResponse.data ?? tenantResponse ?? [])
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err, t('tickets.loadError')))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [t])

  useEffect(() => {
    setTargetAdminId('')
  }, [tenantId])

  async function handleCreate(event) {
    event.preventDefault()
    if (!tenantId || !title.trim() || !body.trim()) return

    setSaving(true)
    setError('')
    try {
      const ticket = await cmsTicketsApi.createCmsTicket({
        tenant_id: Number(tenantId),
        target_admin_id: targetAdminId ? Number(targetAdminId) : null,
        title: title.trim(),
        category,
        priority,
        body: body.trim(),
      })
      navigate(`/super-admin/tickets/${ticket.id}`)
    } catch (err) {
      setError(extractErrorMessage(err, t('tickets.createError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="list-page mx-auto max-w-[1100px]">
      <SuperAdminPageHeader
        title={t('superAdmin.tickets.title')}
        subtitle={t('superAdmin.tickets.subtitle')}
      />

      {error ? <p className="error mb-4">{error}</p> : null}

      <form className="mb-8 rounded-xl border border-white/10 bg-[#0e131f] p-5" onSubmit={handleCreate}>
        <h2 className="mb-4 text-sm font-semibold text-white">{t('superAdmin.tickets.new')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="pg-field">
            <span className="pg-field-label">{t('superAdmin.tickets.entity')}</span>
            <CutSelect
              className="w-full"
              value={tenantId}
              onChange={setTenantId}
              placeholder={t('superAdmin.tickets.entityPlaceholder')}
              options={[
                { value: '', label: t('superAdmin.tickets.entityPlaceholder') },
                ...tenants.map((tenant) => ({
                  value: String(tenant.id),
                  label: tenant.name,
                })),
              ]}
            />
          </label>
          <label className="pg-field">
            <span className="pg-field-label">{t('superAdmin.tickets.adminOptional')}</span>
            <CutSelect
              className="w-full"
              value={targetAdminId}
              onChange={setTargetAdminId}
              disabled={!selectedTenant}
              placeholder={t('superAdmin.tickets.allAdmins')}
              options={[
                { value: '', label: t('superAdmin.tickets.allAdmins') },
                ...admins.map((admin) => ({
                  value: String(admin.id),
                  label: admin.full_name || admin.email,
                })),
              ]}
            />
          </label>
        </div>
        <label className="pg-field mt-4">
          <span className="pg-field-label">{t('tickets.fields.title')}</span>
          <input className="pg-field-control" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="pg-field">
            <span className="pg-field-label">{t('tickets.fields.category')}</span>
            <CutSelect
              className="w-full"
              value={category}
              onChange={setCategory}
              options={TICKET_CATEGORIES.map((item) => ({ value: item, label: item }))}
            />
          </label>
          <label className="pg-field">
            <span className="pg-field-label">{t('tickets.fields.priority')}</span>
            <CutSelect
              className="w-full"
              value={priority}
              onChange={setPriority}
              options={TICKET_PRIORITIES.map((item) => ({ value: item.id, label: t(item.labelKey) }))}
            />
          </label>
        </div>
        <label className="pg-field mt-4">
          <span className="pg-field-label">{t('tickets.fields.description')}</span>
          <textarea className="pg-field-control min-h-28" value={body} onChange={(event) => setBody(event.target.value)} required />
        </label>
        <div className="mt-4">
          <NeonButton type="submit" className={saving ? 'pointer-events-none opacity-45' : ''}>
            {saving ? t('tickets.submitting') : t('tickets.submit')}
          </NeonButton>
        </div>
      </form>

      {loading ? <p className="text-sm text-slate-400">{t('common.loading')}</p> : null}

      <div className="flex flex-col gap-2">
        {!loading && tickets.length === 0 ? (
          <p className="text-sm text-slate-400">{t('tickets.emptyTitle')}</p>
        ) : null}
        {tickets.map((ticket) => (
          <Link key={ticket.id} to={`/super-admin/tickets/${ticket.id}`} className="pg-ticket">
            <span className="pg-ticket__face">
              <span className="pg-ticket-id">#{ticket.id}</span>
              <span className="min-w-0">
                <span className="pg-ticket-title flex flex-wrap items-center gap-2">
                  <span className="truncate">{ticket.title}</span>
                  <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-xs font-bold">CMS SUPPORT / SUPERADMIN</span>
                </span>
                <span className="pg-ticket-meta block truncate">
                  {ticket.tenant?.name ?? '—'}
                  <span className="mx-1.5 text-white/20">·</span>
                  {ticket.target_admin?.full_name ?? t('superAdmin.tickets.allAdmins')}
                </span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
