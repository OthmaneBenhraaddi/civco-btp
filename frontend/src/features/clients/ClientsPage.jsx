import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import PermissionGate from '../../components/PermissionGate'
import Modal from '../../components/Modal'
import RoleBadge from '../../components/RoleBadge'
import SearchInput from '../../components/SearchInput'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import PageShell from '../../components/prodigy/PageShell'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as clientsApi from '../../api/clients'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { getClientRoleId, setClientRoleId } from '../roles/clientRoleStore'
import { getAllRoles, getRoleById, getRoleLabel } from '../roles/rolesStore'
import {
  logClientCreated,
  logClientDeleted,
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
  role_id: 'client_extern',
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

function ClientStatusBadge({ active, t }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        active
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
      ].join(' ')}
    >
      {active ? t('common.active') : t('common.inactive')}
    </span>
  )
}

function DetailField({ label, value }) {
  return (
    <div className="pg-panel-muted p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--pg-text-dim)]">{label}</p>
      <p className="mt-1 text-sm text-slate-200">{value || '—'}</p>
    </div>
  )
}

function clientCardClasses(isSelected) {
  return [
    'client-list-item pg-list-item flex w-full items-start gap-3',
    isSelected ? 'is-active' : '',
  ].join(' ')
}

export default function ClientsPage() {
  const { hasPermission, user, roles } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [clients, setClients] = useState([])
  const [meta, setMeta] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [roleMapVersion, setRoleMapVersion] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState(null)

  async function loadClients(page = 1) {
    setLoading(true)
    setError('')

    try {
      const data = await clientsApi.fetchClients({ search, page })
      setClients(data.data ?? [])
      setMeta(data.meta ?? null)
    } catch (err) {
      setError(extractErrorMessage(err, t('clients.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [search])

  useEffect(() => {
    const prefillSearch = location.state?.prefillSearch
    if (typeof prefillSearch === 'string' && prefillSearch.trim()) {
      setSearch(prefillSearch)
    }
  }, [location.state])

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  )

  useEffect(() => {
    if (selectedClientId && !clients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(null)
    }
  }, [clients, selectedClientId])

  void roleMapVersion

  function resolveClientRole(clientId) {
    return getRoleById(getClientRoleId(clientId))
  }

  function assignClientRole(clientId, roleId) {
    setClientRoleId(clientId, roleId)
    setRoleMapVersion((value) => value + 1)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(client) {
    setEditing(client)
    setForm({
      name: client.name ?? '',
      contact_name: client.contact_name ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      address_line1: client.address_line1 ?? '',
      city: client.city ?? '',
      postal_code: client.postal_code ?? '',
      country: client.country ?? 'FR',
      notes: client.notes ?? '',
      is_active: client.is_active ?? true,
      role_id: getClientRoleId(client.id),
    })
    setModalOpen(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const { role_id, ...payload } = form

      const actor = resolveActorLabel(user, roles, t('layout.profileFallbackName'))

      if (editing) {
        await clientsApi.updateClient(editing.id, payload)
        setClientRoleId(editing.id, role_id)
        logClientUpdated({ actor, name: payload.name || editing.name })
      } else {
        const created = await clientsApi.createClient(payload)
        if (created?.id) {
          setClientRoleId(created.id, role_id)
          setSelectedClientId(created.id)
        }
        logClientCreated({ actor, name: payload.name })
      }

      setRoleMapVersion((value) => value + 1)
      setModalOpen(false)
      await loadClients(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('clients.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(client) {
    if (!window.confirm(t('clients.deleteConfirm', { name: client.name }))) {
      return
    }

    try {
      await clientsApi.deleteClient(client.id)
      logClientDeleted({
        actor: resolveActorLabel(user, roles, t('layout.profileFallbackName')),
        name: client.name,
      })
      if (selectedClientId === client.id) {
        setSelectedClientId(null)
      }
      await loadClients(meta?.current_page ?? 1)
    } catch (err) {
      setError(extractErrorMessage(err, t('clients.deleteError')))
    }
  }

  const selectedRole = selectedClient ? resolveClientRole(selectedClient.id) : null

  return (
    <PageShell
      className="clients-page"
      compact
      title={t('clients.title')}
      actions={(
        <PermissionGate permission="client.create">
          <NeonButton onClick={openCreate}>{t('clients.new')}</NeonButton>
        </PermissionGate>
      )}
    >
      <div className="toolbar mb-6">
        <SearchInput
          placeholder={t('clients.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="mt-2 flex w-full flex-col items-start gap-5 lg:flex-row">
          <aside className="pg-panel w-full space-y-1 p-2 lg:w-1/3">
            {clients.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">{t('clients.empty')}</p>
            ) : (
              clients.map((client) => {
                const role = resolveClientRole(client.id)
                const isSelected = client.id === selectedClientId

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => setSelectedClientId(client.id)}
                    className={clientCardClasses(isSelected)}
                  >
                    <ClientAvatar name={client.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-200">{client.name}</span>
                      <span className="mt-1.5 block">
                        <RoleBadge label={getRoleLabel(role, t)} tone={role.badgeTone} />
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </aside>

          <section className="pg-panel flex min-h-[400px] w-full flex-col p-6 lg:w-2/3">
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
                        <ClientStatusBadge active={selectedClient.is_active} t={t} />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {hasPermission('client.update') ? (
                      <button
                        type="button"
                        className="client-action-btn ghost"
                        onClick={() => openEdit(selectedClient)}
                      >
                        {t('common.edit')}
                      </button>
                    ) : null}
                    {hasPermission('client.delete') ? (
                      <button
                        type="button"
                        className="client-action-btn ghost danger"
                        onClick={() => handleDelete(selectedClient)}
                      >
                        {t('common.delete')}
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
                      {selectedRole ? (
                        <RoleBadge label={getRoleLabel(selectedRole, t)} tone={selectedRole.badgeTone} />
                      ) : null}
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

                <div className="mt-auto pt-6">
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

      <Modal title={editing ? t('clients.edit') : t('clients.new')} open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            {t('clients.name')} *
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label>
            {t('clients.contactName')}
            <input
              value={form.contact_name}
              onChange={(event) => setForm({ ...form, contact_name: event.target.value })}
            />
          </label>
          <label>
            {t('clients.email')}
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            {t('clients.phone')}
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <label>
            {t('clients.assignedRole')}
            <CutSelect
              className="w-full"
              value={form.role_id}
              onChange={(role_id) => setForm({ ...form, role_id })}
              options={getAllRoles().map((roleOption) => ({
                value: roleOption.id,
                label: getRoleLabel(roleOption, t),
              }))}
            />
          </label>
          <label>
            {t('clients.address')}
            <input
              value={form.address_line1}
              onChange={(event) => setForm({ ...form, address_line1: event.target.value })}
            />
          </label>
          <div className="form-row">
            <label>
              {t('clients.city')}
              <input
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </label>
            <label>
              {t('clients.postalCode')}
              <input
                value={form.postal_code}
                onChange={(event) => setForm({ ...form, postal_code: event.target.value })}
              />
            </label>
          </div>
          <label>
            {t('clients.notes')}
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
            />
            {t('common.active')}
          </label>
          <button type="submit" disabled={saving}>
            {saving ? t('common.saving') : editing ? t('clients.update') : t('clients.create')}
          </button>
        </form>
      </Modal>
    </PageShell>
  )
}
