import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import { useTranslation } from '../../i18n/LanguageContext'
import * as superAdminApi from '../../api/superAdmin'
import { extractErrorMessage } from '../../utils/apiHelpers'
import EntityEditModal from './EntityEditModal'
import AdminCredentialsPanel from './AdminCredentialsPanel'
import AddTenantAdminForm from './AddTenantAdminForm'
import SuperAdminPageHeader from './components/SuperAdminPageHeader'
import StatusActionButtons from './components/StatusActionButtons'
import ProvisionSuccessBanner from './components/ProvisionSuccessBanner'
import { buildTenantWorkspaceUrl } from './utils/tenantWorkspaceUrl'

const STATUS_FILTERS = [
  { value: '', labelKey: 'superAdmin.filters.all' },
  { value: 'active', labelKey: 'status.active' },
  { value: 'inactive', labelKey: 'status.inactive' },
  { value: 'archived', labelKey: 'status.archived' },
]

export default function SuperAdminEntitiesPage() {
  const { t } = useTranslation()
  const [tenants, setTenants] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingTenantId, setUpdatingTenantId] = useState(null)
  const [updatingAdminKey, setUpdatingAdminKey] = useState(null)
  const [error, setError] = useState('')
  const [adminProvisionResult, setAdminProvisionResult] = useState(null)
  const [addingAdminTenantId, setAddingAdminTenantId] = useState(null)
  const [editingTenant, setEditingTenant] = useState(null)

  const statusLabels = {
    active: t('status.active'),
    inactive: t('status.inactive'),
    archived: t('status.archived'),
  }

  const loadTenants = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await superAdminApi.fetchTenants({
        status: statusFilter || undefined,
      })
      setTenants(data.data ?? data)
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.loadError')))
    } finally {
      setLoading(false)
    }
  }, [statusFilter, t])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  function toggleExpanded(tenantId) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(tenantId)) {
        next.delete(tenantId)
      } else {
        next.add(tenantId)
      }
      return next
    })
  }

  async function handleTenantStatusChange(tenantId, status) {
    setUpdatingTenantId(tenantId)
    setError('')

    try {
      await superAdminApi.updateTenantStatus(tenantId, status)
      await loadTenants()
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.updateTenantError')))
    } finally {
      setUpdatingTenantId(null)
    }
  }

  async function handleAddAdmin(tenantId, payload) {
    setSaving(true)
    setError('')
    setAdminProvisionResult(null)

    try {
      const result = await superAdminApi.createTenantAdmin(tenantId, payload)
      setAdminProvisionResult(result)
      setAddingAdminTenantId(null)
      setExpandedIds((current) => new Set([...current, tenantId]))
      await loadTenants()
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.addAdmin.error')))
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function handleEditTenant(payload) {
    if (!editingTenant) {
      return
    }

    setSaving(true)
    setError('')

    try {
      await superAdminApi.updateTenant(editingTenant.id, payload)
      setEditingTenant(null)
      await loadTenants()
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.edit.error')))
      throw err
    } finally {
      setSaving(false)
    }
  }

  async function handleAdminStatusChange(tenantId, userId, status) {
    const key = `${tenantId}-${userId}`
    setUpdatingAdminKey(key)
    setError('')

    try {
      await superAdminApi.updateTenantAdminStatus(tenantId, userId, status)
      await loadTenants()
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.updateAdminError')))
    } finally {
      setUpdatingAdminKey(null)
    }
  }

  return (
    <div className="list-page mx-auto max-w-[1200px]">
      <SuperAdminPageHeader
        title={t('superAdmin.nav.entities')}
        subtitle={t('superAdmin.entities.subtitle')}
      />

      {error ? <p className="error mb-4">{error}</p> : null}

      <ProvisionSuccessBanner result={adminProvisionResult} variant="admin" />

      <section className="card p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">{t('superAdmin.existingEntities')}</h2>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value || 'all'}
                type="button"
                className={[
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  statusFilter === filter.value
                    ? 'bg-white/10 text-white ring-1 ring-white/15'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                ].join(' ')}
                onClick={() => setStatusFilter(filter.value)}
              >
                {t(filter.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : tenants.length === 0 ? (
          <p className="text-slate-400">{t('superAdmin.empty')}</p>
        ) : (
          <div className="space-y-3">
            {tenants.map((tenant) => {
              const expanded = expandedIds.has(tenant.id)
              const admins = tenant.admins ?? []
              const workspaceUrl = buildTenantWorkspaceUrl(tenant.subdomain, tenant.workspace_url)

              return (
                <article
                  key={tenant.id}
                  className="rounded-xl border border-white/[0.06] bg-[#0a0b0d]/40"
                >
                  <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {tenant.logo_url ? (
                          <img
                            src={tenant.logo_url}
                            alt=""
                            className="h-8 w-8 rounded-lg border border-white/10 object-contain bg-white/5 p-1"
                          />
                        ) : null}
                        <h3 className="text-base font-semibold text-white">{tenant.name}</h3>
                        <StatusBadge status={tenant.status} />
                        <span className="text-xs text-slate-500">
                          {t('superAdmin.usersLabel')}: {tenant.users_count ?? 0}
                        </span>
                      </div>
                      <p className="font-mono text-sm text-slate-400">{tenant.subdomain}.monerp.com</p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/[0.06]"
                          onClick={() => setEditingTenant(tenant)}
                        >
                          {t('superAdmin.edit.open')}
                        </button>
                        <a
                          href={workspaceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-500/15"
                        >
                          {t('superAdmin.quickAccess')}
                        </a>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:text-right">
                          {t('superAdmin.entityStatusActions')}
                        </p>
                        <StatusActionButtons
                          currentStatus={tenant.status}
                          disabled={updatingTenantId === tenant.id}
                          labels={statusLabels}
                          onSelect={(status) => handleTenantStatusChange(tenant.id, status)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] px-4 py-3">
                    <button
                      type="button"
                      className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
                      onClick={() => toggleExpanded(tenant.id)}
                    >
                      {expanded ? t('superAdmin.hideAdmins') : t('superAdmin.showAdmins', { count: admins.length })}
                    </button>

                    {expanded ? (
                      <div className="mt-3 overflow-x-auto">
                        {admins.length === 0 ? (
                          <p className="text-sm text-slate-500">{t('superAdmin.noAdmins')}</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500">
                                <th className="pb-2 pr-4">{t('superAdmin.adminName')}</th>
                                <th className="pb-2 pr-4">{t('superAdmin.adminEmail')}</th>
                                <th className="pb-2 pr-4">{t('superAdmin.accountStatus')}</th>
                                <th className="pb-2">{t('common.actions')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {admins.map((admin) => {
                                const adminKey = `${tenant.id}-${admin.id}`

                                return (
                                  <tr key={admin.id} className="border-t border-white/[0.04]">
                                    <td className="py-3 pr-4 text-slate-200">{admin.full_name}</td>
                                    <td className="py-3 pr-4 font-mono text-slate-300">{admin.email}</td>
                                    <td className="py-3 pr-4">
                                      <StatusBadge status={admin.status} />
                                    </td>
                                    <td className="py-3">
                                      <div className="flex flex-col gap-3">
                                        <StatusActionButtons
                                          currentStatus={admin.status}
                                          disabled={updatingAdminKey === adminKey}
                                          labels={statusLabels}
                                          onSelect={(status) => handleAdminStatusChange(tenant.id, admin.id, status)}
                                        />
                                        <AdminCredentialsPanel
                                          tenantId={tenant.id}
                                          admin={admin}
                                          onCredentialsUpdated={loadTenants}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}

                        {addingAdminTenantId === tenant.id ? (
                          <AddTenantAdminForm
                            tenant={tenant}
                            saving={saving}
                            onSubmit={(payload) => handleAddAdmin(tenant.id, payload)}
                            onCancel={() => setAddingAdminTenantId(null)}
                          />
                        ) : (
                          <button
                            type="button"
                            className="mt-4 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/15"
                            onClick={() => {
                              setAddingAdminTenantId(tenant.id)
                              setAdminProvisionResult(null)
                            }}
                          >
                            {t('superAdmin.addAdmin.open')}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <EntityEditModal
        tenant={editingTenant}
        open={Boolean(editingTenant)}
        saving={saving}
        onClose={() => setEditingTenant(null)}
        onSubmit={handleEditTenant}
      />
    </div>
  )
}
