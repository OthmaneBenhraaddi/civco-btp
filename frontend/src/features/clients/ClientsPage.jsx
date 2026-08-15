import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import Modal from '../../components/Modal'
import ConfirmArchiveModal from '../../components/ConfirmArchiveModal'
import RoleBadge from '../../components/RoleBadge'
import ClientBadge, { ClientBadgeList } from '../../components/ClientBadge'
import SearchInput from '../../components/SearchInput'
import CutSelect from '../../components/prodigy/CutSelect'
import { useAuth } from '../../context/AuthContext'
import { useStealthMode, useStealthModeRefresh } from '../../context/StealthModeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useDemoGuards } from '../../hooks/useDemoGuards'
import { useActionToast } from '../../hooks/useActionToast'
import * as clientsApi from '../../api/clients'
import * as badgesApi from '../../api/badges'
import { BTN_PRIMARY, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import ClientContactsPanel from './ClientContactsPanel'
import ClientPortalPanel from './ClientPortalPanel'
import ClientBadgesPanel, { isBadgeSelected, normalizeBadgeIds } from './ClientBadgesPanel'
import { getClientRoleId, setClientRoleId } from '../roles/clientRoleStore'
import { getAllRoles, getRoleById, getRoleLabel } from '../roles/rolesStore'
import * as clientContactsApi from '../../api/clientContacts'
import * as teamMembersApi from '../../api/teamMembers'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { isPlatformSuperAdmin } from '../../utils/authIdentity'
import { filterOfficialClients, isOfficialClient } from '../../utils/stealthVisibility'
import NewClientModal from './components/NewClientModal'
import {
  logClientCreated,
  logClientArchived,
  logClientUpdated,
  resolveActorLabel,
} from '../history/auditLogActions'

const emptyForm = {
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  address_line1: '',
  city: '',
  postal_code: '',
  country: 'FR',
  notes: '',
  is_active: true,
  is_official: true,
  role_id: 'client_extern',
  badge_ids: [],
}

function ClientAvatar({ name }) {
  const seed = encodeURIComponent(name || 'Client')

  return (
    <img
      src={`https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=334155`}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full ring-1 ring-slate-700/60"
    />
  )
}

function ClientStatusBadge({ client, t }) {
  const status = client.status ?? (client.is_active ? 'active' : 'inactive')
  const styles = {
    active: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    inactive: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
    archived: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  }

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        styles[status] ?? styles.inactive,
      ].join(' ')}
    >
      {t(`common.${status}`) === `common.${status}` ? status : t(`common.${status}`)}
    </span>
  )
}

function IconArchive({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h16v3H4z" strokeLinejoin="round" />
      <path d="M6 10v8a1 1 0 001 1h10a1 1 0 001-1v-8" strokeLinejoin="round" />
      <path d="M10 14h4" strokeLinecap="round" />
    </svg>
  )
}

function DetailField({ label, value }) {
  return (
    <div className="rounded-lg bg-[#0a0b0d]/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-200">{value || '—'}</p>
    </div>
  )
}

function clientCardClasses(isSelected, isArchived) {
  const base = [
    'client-list-item flex w-full items-start gap-3 border px-3 py-2.5 text-left',
    'bg-[var(--pg-bg-elevated)] text-white transition-all duration-150 ease-in-out',
  ]

  if (isArchived) {
    base.push('opacity-60')
  }

  if (isSelected) {
    base.push('border-[rgba(34,197,94,0.35)] ring-1 ring-[rgba(34,197,94,0.2)]')
  } else {
    base.push('border-white/[0.06] hover:border-white/10')
  }

  return base.join(' ')
}

export default function ClientsPage() {
  const { hasPermission, user, roles, isAdmin } = useAuth()
  const { stealthMode } = useStealthMode()
  const stealthModeRef = useRef(stealthMode)
  stealthModeRef.current = stealthMode
  const { t } = useTranslation()
  const { blockDestructive } = useDemoGuards()
  const { toastError } = useActionToast()
  const location = useLocation()
  const isSuperAdmin = isPlatformSuperAdmin(user)
  const [clients, setClients] = useState([])
  const clientsBaselineRef = useRef([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [tenantOptions, setTenantOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [portalToggling, setPortalToggling] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving, setArchiving] = useState(false)
  const [roleMapVersion, setRoleMapVersion] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState(null)
  const [selectedClientDetail, setSelectedClientDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [availableBadges, setAvailableBadges] = useState([])

  async function loadClients(page = 1, { silent = false } = {}) {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const params = { search, page }
      if (isSuperAdmin && tenantFilter) {
        params.tenant_id = tenantFilter
      }

      const data = await clientsApi.fetchClients(params)
      const list = data.data ?? []
      setClients(list)
      setMeta(data.meta ?? null)

      if (!stealthModeRef.current) {
        clientsBaselineRef.current = list
      }
    } catch (err) {
      if (!silent) {
        setError(extractErrorMessage(err, t('clients.loadError')))
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const visibleClients = useMemo(
    () => (stealthMode ? filterOfficialClients(clients) : clients),
    [clients, stealthMode],
  )

  useEffect(() => {
    loadClients()
  }, [search, tenantFilter, isSuperAdmin])

  useStealthModeRefresh(({ active }) => {
    if (!active) {
      if (clientsBaselineRef.current.length > 0) {
        setClients(clientsBaselineRef.current)
      }
      loadClients(meta?.current_page ?? 1, { silent: true })
    }
  })

  useEffect(() => {
    if (!isSuperAdmin) return undefined

    let cancelled = false

    teamMembersApi.fetchTeamTenantOptions()
      .then((response) => {
        if (!cancelled) setTenantOptions(response.data ?? [])
      })
      .catch(() => {
        if (!cancelled) setTenantOptions([])
      })

    return () => {
      cancelled = true
    }
  }, [isSuperAdmin])

  useEffect(() => {
    async function loadBadges() {
      try {
        const data = await badgesApi.fetchBadges()
        setAvailableBadges(data.data ?? [])
      } catch {
        setAvailableBadges([])
      }
    }

    loadBadges()
  }, [])

  useEffect(() => {
    const prefillSearch = location.state?.prefillSearch
    if (typeof prefillSearch === 'string' && prefillSearch.trim()) {
      setSearch(prefillSearch)
    }
  }, [location.state])

  const selectedClient = useMemo(() => {
    if (selectedClientDetail?.id === selectedClientId) {
      return selectedClientDetail
    }

    return visibleClients.find((client) => client.id === selectedClientId) ?? null
  }, [visibleClients, selectedClientId, selectedClientDetail])

  async function loadClientDetail(clientId) {
    if (!clientId) {
      setSelectedClientDetail(null)
      return
    }

    setDetailLoading(true)

    try {
      const data = await clientsApi.fetchClient(clientId)
      setSelectedClientDetail(data.data ?? data)
    } catch {
      setSelectedClientDetail(clients.find((client) => client.id === clientId) ?? null)
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    loadClientDetail(selectedClientId)
  }, [selectedClientId])

  useEffect(() => {
    if (selectedClientId && !visibleClients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(null)
      setSelectedClientDetail(null)
    }
  }, [visibleClients, selectedClientId])

  useEffect(() => {
    if (
      stealthMode
      && selectedClientDetail
      && !isOfficialClient(selectedClientDetail)
    ) {
      setSelectedClientId(null)
      setSelectedClientDetail(null)
    }
  }, [stealthMode, selectedClientDetail])

  void roleMapVersion

  function resolveClientRole(clientId) {
    return getRoleById(getClientRoleId(clientId))
  }

  function assignClientRole(clientId, roleId) {
    setClientRoleId(clientId, roleId)
    setRoleMapVersion((value) => value + 1)
  }

  function openCreate() {
    setCreateModalOpen(true)
  }

  async function openEdit(client) {
    let source = client

    if (client.id === selectedClientId && selectedClientDetail?.id === client.id) {
      source = selectedClientDetail
    } else {
      try {
        const data = await clientsApi.fetchClient(client.id)
        source = data.data ?? data
      } catch {
        source = client
      }
    }

    setEditing(source)
    setForm({
      name: source.name ?? '',
      contact_name: source.contact_name ?? '',
      email: source.email ?? '',
      phone: source.phone ?? '',
      address_line1: source.address_line1 ?? '',
      city: source.city ?? '',
      postal_code: source.postal_code ?? '',
      country: source.country ?? 'FR',
      notes: source.notes ?? '',
      is_active: source.is_active ?? true,
      is_official: source.is_official ?? true,
      role_id: getClientRoleId(source.id),
      badge_ids: normalizeBadgeIds((source.badges ?? []).map((badge) => badge.id)),
    })
    setEditModalOpen(true)
  }

  async function handleCreateClient({ form: wizardForm, extraContacts }) {
    setSaving(true)
    setError('')

    try {
      const { role_id, ...payload } = wizardForm
      payload.badge_ids = normalizeBadgeIds(payload.badge_ids)

      const actor = resolveActorLabel(user, roles, t('layout.profileFallbackName'))
      const created = await clientsApi.createClient(payload)
      const createdId = created?.data?.id ?? created?.id

      if (createdId) {
        setClientRoleId(createdId, role_id)
        setSelectedClientId(createdId)

        for (const contact of extraContacts) {
          await clientContactsApi.createClientContact(createdId, contact)
        }
      }

      logClientCreated({ actor, name: payload.name })
      setRoleMapVersion((value) => value + 1)
      setCreateModalOpen(false)
      await loadClients(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('clients.saveError')))
      toastError(extractErrorMessage(err, t('clients.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    if (!editing) return

    setSaving(true)
    setError('')

    try {
      const { role_id, ...payload } = form
      payload.badge_ids = normalizeBadgeIds(payload.badge_ids)

      const actor = resolveActorLabel(user, roles, t('layout.profileFallbackName'))
      await clientsApi.updateClient(editing.id, payload)
      setClientRoleId(editing.id, role_id)
      logClientUpdated({ actor, name: payload.name || editing.name })

      setRoleMapVersion((value) => value + 1)
      setEditModalOpen(false)
      await loadClients(meta?.current_page ?? 1)
      await loadClientDetail(editing.id)
    } catch (err) {
      setError(extractErrorMessage(err, t('clients.saveError')))
      toastError(extractErrorMessage(err, t('clients.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function confirmArchiveClient() {
    if (!archiveTarget) {
      return
    }

    if (blockDestructive(t('clients.archive'))) {
      return
    }

    setArchiving(true)
    setError('')

    try {
      const response = await clientsApi.archiveClient(archiveTarget.id)
      const archived = response.data ?? response

      logClientArchived({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        name: archived.name ?? archiveTarget.name,
      })

      setClients((current) => current.map((client) => (
        client.id === archiveTarget.id ? { ...client, ...archived } : client
      )))

      if (selectedClientId === archiveTarget.id) {
        await loadClientDetail(archiveTarget.id)
      }

      setArchiveTarget(null)
      await loadClients(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('clients.archiveError')))
      toastError(extractErrorMessage(err, t('clients.archiveError')))
    } finally {
      setArchiving(false)
    }
  }

  const selectedRole = selectedClient ? resolveClientRole(selectedClient.id) : null
  const selectedIsArchived = selectedClient?.status === 'archived' || Boolean(selectedClient?.archived_at)
  async function handlePortalToggle(active) {
    if (!selectedClient) return

    setPortalToggling(true)
    setError('')

    try {
      const data = await clientsApi.toggleClientPortalStatus(selectedClient.id, active)
      const updated = data.data ?? data
      setSelectedClientDetail(updated)
      await loadClients(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('clients.portal.toggleError')))
    } finally {
      setPortalToggling(false)
    }
  }

  return (
    <div className="clients-page list-page">
      <header className="page-header">
        <div>
          <h1>{t('clients.title')}</h1>
        </div>
        <PermissionGate permission="client.create">
          <button type="button" onClick={openCreate}>{t('clients.new')}</button>
        </PermissionGate>
      </header>

      <div className="toolbar flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder={t('clients.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {isSuperAdmin ? (
          <CutSelect
            className="min-w-[180px]"
            size="sm"
            value={tenantFilter}
            onChange={setTenantFilter}
            options={[
              { value: '', label: t('clients.entityFilterAll') },
              ...tenantOptions.map((tenant) => ({
                value: String(tenant.id),
                label: tenant.name,
              })),
            ]}
          />
        ) : null}
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-400">{t('common.loading')}</p>
      ) : (
        <div className="mt-6 flex w-full flex-col items-start gap-6 lg:flex-row">
          <aside className="pg-card w-full space-y-1 p-2 lg:w-1/3">
            {visibleClients.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">{t('clients.empty')}</p>
            ) : (
              visibleClients.map((client) => {
                const role = resolveClientRole(client.id)
                const isSelected = client.id === selectedClientId
                const isArchived = client.status === 'archived' || Boolean(client.archived_at)

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className={clientCardClasses(isSelected, isArchived)}
                  >
                    <ClientAvatar name={client.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{client.name}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1">
                        <RoleBadge label={getRoleLabel(role, t)} tone={role.badgeTone} />
                        <ClientBadgeList badges={client.badges} />
                        {isArchived ? <ClientStatusBadge client={client} t={t} /> : null}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </aside>

          <section className="pg-card flex min-h-[400px] w-full flex-col p-6 lg:w-2/3">
            {!selectedClient ? (
              <p className="m-auto text-center text-xs text-slate-500">{t('clients.selectPrompt')}</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <ClientAvatar name={selectedClient.name} />
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-bold text-white">{selectedClient.name}</h2>
                      <div className="mt-1.5">
                        <ClientStatusBadge client={selectedClient} t={t} />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {hasPermission('client.update') && !selectedIsArchived ? (
                      <button
                        type="button"
                        className="client-action-btn ghost"
                        onClick={() => openEdit(selectedClient)}
                      >
                        {t('common.edit')}
                      </button>
                    ) : null}
                    {hasPermission('client.delete') && !selectedIsArchived ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/15"
                        onClick={() => setArchiveTarget(selectedClient)}
                      >
                        <IconArchive className="h-3.5 w-3.5" />
                        {t('common.archive')}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 border-y border-slate-800/50 py-4 sm:grid-cols-2">
                  <DetailField label={t('clients.contactName')} value={selectedClient.contact_name} />
                  <DetailField label={t('clients.email')} value={selectedClient.email} />
                  <DetailField label={t('clients.phone')} value={selectedClient.phone} />
                  <div className="rounded-lg bg-[#0a0b0d]/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      {t('clients.assignedRole')}
                    </p>
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-1">
                        {selectedRole ? (
                          <RoleBadge label={getRoleLabel(selectedRole, t)} tone={selectedRole.badgeTone} />
                        ) : null}
                      </div>
                      <CutSelect
                        className="w-full"
                        size="sm"
                        value={selectedRole?.id ?? 'client_extern'}
                        onChange={(roleId) => assignClientRole(selectedClient.id, roleId)}
                        options={getAllRoles().map((item) => ({
                          value: item.id,
                          label: getRoleLabel(item, t),
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <ClientPortalPanel
                    portalUser={selectedClient.portal_user}
                    clientEmail={selectedClient.email}
                    canManage={isAdmin && hasPermission('client.update') && !selectedIsArchived}
                    toggling={portalToggling}
                    onToggle={handlePortalToggle}
                  />
                </div>

                <div className="mt-6">
                  <ClientBadgesPanel
                    clientId={selectedClient.id}
                    badges={selectedClient.badges ?? []}
                    onBadgesChange={async () => {
                      await loadClientDetail(selectedClient.id)
                      await loadClients(meta?.current_page ?? 1)
                    }}
                    canManage={hasPermission('client.update')}
                  />
                </div>

                <div className="mt-6">
                  {detailLoading ? (
                    <p className="text-xs text-slate-500">{t('common.loading')}</p>
                  ) : (
                    <ClientContactsPanel
                      clientId={selectedClient.id}
                      contacts={selectedClient.contacts ?? []}
                      onContactsChange={() => loadClientDetail(selectedClient.id)}
                      canManage={hasPermission('client.update')}
                    />
                  )}
                </div>

                <div className="mt-6">
                  <div className="rounded-xl border border-slate-800/60 bg-[#0a0b0d]/60 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      {t('clients.activeProjects')}
                    </p>
                    <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                      {selectedClient.projects_count ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{t('clients.projectsLinked')}</p>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {meta && meta.last_page > 1 ? (
        <div className="pagination">
          <button
            type="button"
            className="ghost"
            disabled={meta.current_page <= 1}
            onClick={() => loadClients(meta.current_page - 1)}
          >
            {t('common.previous')}
          </button>
          <span>{t('common.page', { current: meta.current_page, total: meta.last_page })}</span>
          <button
            type="button"
            className="ghost"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => loadClients(meta.current_page + 1)}
          >
            {t('common.next')}
          </button>
        </div>
      ) : null}

      <NewClientModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        availableBadges={availableBadges}
        onSubmit={handleCreateClient}
        saving={saving}
      />

      <Modal title={t('clients.edit')} open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <form className="stack" onSubmit={handleEditSubmit}>
          <label>
            <span className={LABEL_CLASS}>{t('clients.name')} *</span>
            <input
              className={FIELD_CLASS}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            <span className={LABEL_CLASS}>{t('clients.contactName')}</span>
            <input
              className={FIELD_CLASS}
              value={form.contact_name}
              onChange={(event) => setForm({ ...form, contact_name: event.target.value })}
            />
          </label>
          <label>
            <span className={LABEL_CLASS}>{t('clients.email')}</span>
            <input
              type="email"
              className={FIELD_CLASS}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            <span className={LABEL_CLASS}>{t('clients.phone')}</span>
            <input
              className={FIELD_CLASS}
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <div>
            <span className={LABEL_CLASS}>{t('clients.assignedRole')}</span>
            <CutSelect
              className="mt-1 w-full"
              value={form.role_id}
              onChange={(role_id) => setForm({ ...form, role_id })}
              options={getAllRoles().map((roleOption) => ({
                value: roleOption.id,
                label: getRoleLabel(roleOption, t),
              }))}
            />
          </div>
          <div>
            <p className={LABEL_CLASS}>{t('clients.assignBadges')}</p>
            {availableBadges.length === 0 ? (
              <p className="text-xs text-slate-400">{t('clients.noBadgesAvailable')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {availableBadges.map((badge) => (
                  <label key={badge.id} className="checkbox flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={isBadgeSelected(form.badge_ids, badge.id)}
                      onChange={(event) => {
                        const badgeId = Number(badge.id)
                        const badgeIds = event.target.checked
                          ? normalizeBadgeIds([...form.badge_ids, badgeId])
                          : normalizeBadgeIds(form.badge_ids).filter((id) => id !== badgeId)
                        setForm({ ...form, badge_ids: badgeIds })
                      }}
                    />
                    <ClientBadge name={badge.name} color={badge.color} />
                  </label>
                ))}
              </div>
            )}
          </div>
          <label>
            <span className={LABEL_CLASS}>{t('clients.address')}</span>
            <input
              className={FIELD_CLASS}
              value={form.address_line1}
              onChange={(event) => setForm({ ...form, address_line1: event.target.value })}
            />
          </label>
          <div className="form-row">
            <label>
              <span className={LABEL_CLASS}>{t('clients.city')}</span>
              <input
                className={FIELD_CLASS}
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>{t('clients.postalCode')}</span>
              <input
                className={FIELD_CLASS}
                value={form.postal_code}
                onChange={(event) => setForm({ ...form, postal_code: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span className={LABEL_CLASS}>{t('clients.notes')}</span>
            <textarea
              rows={3}
              className={FIELD_CLASS}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
          <label className="checkbox text-slate-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            {t('common.active')}
          </label>
          <label className="checkbox text-slate-300">
            <input
              type="checkbox"
              checked={form.is_official}
              onChange={(event) => setForm({ ...form, is_official: event.target.checked })}
            />
            {t('clients.isOfficial')}
          </label>
          <p className="text-xs text-slate-500">{t('clients.isOfficialHint')}</p>
          <button type="submit" disabled={saving} className={BTN_PRIMARY}>
            {saving ? t('common.saving') : t('clients.update')}
          </button>
        </form>
      </Modal>

      <ConfirmArchiveModal
        open={Boolean(archiveTarget)}
        title={t('clients.archiveConfirmTitle')}
        message={t('clients.archiveConfirm', { name: archiveTarget?.name ?? '' })}
        confirming={archiving}
        confirmLabel={t('common.archive')}
        cancelLabel={t('common.cancel')}
        confirmingLabel={t('clients.archiving')}
        onConfirm={confirmArchiveClient}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  )
}
