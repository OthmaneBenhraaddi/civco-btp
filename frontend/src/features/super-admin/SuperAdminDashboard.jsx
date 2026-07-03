import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import { useTranslation } from '../../i18n/LanguageContext'
import * as superAdminApi from '../../api/superAdmin'
import { extractErrorMessage } from '../../utils/apiHelpers'
import EntityCreationWizard from './EntityCreationWizard'
import AdminCredentialsPanel from './AdminCredentialsPanel'

const STATUS_FILTERS = [
  { value: '', labelKey: 'superAdmin.filters.all' },
  { value: 'active', labelKey: 'status.active' },
  { value: 'inactive', labelKey: 'status.inactive' },
  { value: 'archived', labelKey: 'status.archived' },
]

const MANAGEABLE_STATUSES = ['active', 'inactive', 'archived']

function StatusActionButtons({ currentStatus, onSelect, disabled, labels }) {
  return (
    <div className="flex flex-wrap gap-1">
      {MANAGEABLE_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          className={[
            'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
            currentStatus === status
              ? 'bg-white/10 text-white ring-1 ring-white/20'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
          ].join(' ')}
          disabled={disabled || currentStatus === status}
          onClick={() => onSelect(status)}
        >
          {labels[status]}
        </button>
      ))}
    </div>
  )
}

export default function SuperAdminDashboard() {
  const { t } = useTranslation()
  const [tenants, setTenants] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingTenantId, setUpdatingTenantId] = useState(null)
  const [updatingAdminKey, setUpdatingAdminKey] = useState(null)
  const [error, setError] = useState('')
  const [provisionResult, setProvisionResult] = useState(null)

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

  async function handleCreateEntity(payload) {
    setSaving(true)
    setError('')
    setProvisionResult(null)

    try {
      const result = await superAdminApi.createTenant(payload)
      setProvisionResult(result)
      await loadTenants()
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.createError')))
      throw err
    } finally {
      setSaving(false)
    }
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
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('superAdmin.title')}</h1>
          <p>{t('superAdmin.subtitle')}</p>
        </div>
      </header>

      {error ? <p className="error">{error}</p> : null}

      {provisionResult ? (
        <div className="card mb-6 border border-emerald-500/30 bg-emerald-500/5 p-4">
          <h2 className="text-lg font-semibold text-emerald-300">{t('superAdmin.createdTitle')}</h2>
          <p className="mt-2 text-sm text-slate-300">
            {t('superAdmin.createdHint', {
              name: provisionResult.tenant?.name,
              subdomain: provisionResult.tenant?.subdomain,
            })}
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">{t('superAdmin.adminEmail')}</dt>
              <dd className="font-mono text-sm text-white">{provisionResult.admin?.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">{t('superAdmin.tempPassword')}</dt>
              <dd className="font-mono text-sm text-amber-300">{provisionResult.temporary_password}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-slate-500">{t('superAdmin.loginUrl')}</dt>
              <dd className="text-sm">
                <a
                  href={provisionResult.login_url}
                  className="text-indigo-300 underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {provisionResult.login_url}
                </a>
              </dd>
              <p className="mt-2 text-xs text-slate-500">{t('superAdmin.loginUrlHint')}</p>
            </div>
          </dl>
        </div>
      ) : null}

      <EntityCreationWizard saving={saving} onSubmit={handleCreateEntity} />

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
                          {t('superAdmin.members')}: {tenant.users_count ?? 0}
                        </span>
                      </div>
                      <p className="font-mono text-sm text-slate-400">{tenant.subdomain}.monerp.com</p>
                      <p className="text-sm">
                        <a
                          href={tenant.login_url}
                          className="text-indigo-300 underline-offset-2 hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {tenant.login_url}
                        </a>
                      </p>
                    </div>

                    <div className="shrink-0 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
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
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
