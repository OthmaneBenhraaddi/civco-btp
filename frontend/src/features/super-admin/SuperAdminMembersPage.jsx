import { useCallback, useEffect, useMemo, useState } from 'react'
import SearchInput from '../../components/SearchInput'
import StatusBadge from '../../components/StatusBadge'
import CutSelect from '../../components/prodigy/CutSelect'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as teamMembersApi from '../../api/teamMembers'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { resolveMemberFunction } from '../team/teamRoleUtils'
import { appendPlatformAccessLog } from './data/superAdminPlatformLogStore'
import SuperAdminPageHeader from './components/SuperAdminPageHeader'
import { TEAM_DIRECTORY_REFRESH_EVENT } from '../profile/profileSyncEvents'

function StatusToggle({ member, disabled, onToggle, t }) {
  const isActive = member.status === 'active'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(member)}
      className={[
        'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60',
        isActive
          ? 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15'
          : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15',
      ].join(' ')}
    >
      {isActive ? t('team.deactivateAccess') : t('team.activateAccess')}
    </button>
  )
}

export default function SuperAdminMembersPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [tenants, setTenants] = useState([])
  const [members, setMembers] = useState([])
  const [tenantFilter, setTenantFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState(null)
  const [error, setError] = useState('')

  const actorLabel = user?.full_name ?? user?.name ?? t('layout.profileRoleSuperAdmin')

  const loadTenants = useCallback(async () => {
    try {
      const data = await teamMembersApi.fetchTeamTenantOptions()
      setTenants(data.data ?? data)
    } catch {
      setTenants([])
    }
  }, [])

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {}

      if (tenantFilter) {
        params.tenant_id = tenantFilter
      }

      if (search.trim()) {
        params.search = search.trim()
      }

      const data = await teamMembersApi.fetchTeamMembers(params)
      setMembers(data.data ?? data)
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.members.loadError')))
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [search, t, tenantFilter])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadMembers()
    }, search ? 250 : 0)

    return () => window.clearTimeout(timeout)
  }, [loadMembers, search])

  useEffect(() => {
    function handleDirectoryRefresh() {
      loadMembers()
    }

    window.addEventListener(TEAM_DIRECTORY_REFRESH_EVENT, handleDirectoryRefresh)
    return () => window.removeEventListener(TEAM_DIRECTORY_REFRESH_EVENT, handleDirectoryRefresh)
  }, [loadMembers])

  async function handleToggleStatus(member) {
    setTogglingId(member.id)
    setError('')

    try {
      const updated = await teamMembersApi.toggleTeamMemberStatus(member.id)
      const nextMember = updated.data ?? updated
      const nextStatus = nextMember.status ?? (member.status === 'active' ? 'inactive' : 'active')

      appendPlatformAccessLog(
        {
          ...member,
          ...nextMember,
          tenant: nextMember.tenant ?? member.tenant,
        },
        nextStatus,
        actorLabel,
      )

      await loadMembers()
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.members.statusError')))
    } finally {
      setTogglingId(null)
    }
  }

  const memberCountLabel = useMemo(() => {
    return t('superAdmin.members.count', { count: members.length })
  }, [members.length, t])

  return (
    <div className="list-page">
      <SuperAdminPageHeader
        title={t('superAdmin.members.title')}
        subtitle={t('superAdmin.members.subtitle')}
      />

      <div className="toolbar mb-6 flex flex-wrap items-end gap-4">
        <label className="min-w-[14rem] text-xs text-slate-500">
          <span className="mb-1.5 block font-semibold uppercase tracking-wider">
            {t('superAdmin.members.filterByEntity')}
          </span>
          <CutSelect
            className="w-full min-w-[180px]"
            size="sm"
            value={tenantFilter}
            onChange={setTenantFilter}
            options={[
              { value: '', label: t('superAdmin.members.allEntities') },
              ...tenants.map((tenant) => ({
                value: String(tenant.id),
                label: tenant.name,
              })),
            ]}
          />
        </label>

        <div className="min-w-[16rem] flex-1">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t('superAdmin.members.search')}
          </span>
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('superAdmin.members.searchPlaceholder')}
          />
        </div>
      </div>

      {error ? <p className="error mb-4">{error}</p> : null}

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">{t('superAdmin.members.tableTitle')}</h2>
          <span className="text-xs text-slate-500">{memberCountLabel}</span>
        </div>

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : (
          <div className="table-wrap overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>{t('team.fullName')}</th>
                  <th>{t('superAdmin.members.entity')}</th>
                  <th>{t('team.email')}</th>
                  <th>{t('superAdmin.members.roleFunction')}</th>
                  <th>{t('team.status')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={6}>{t('superAdmin.members.empty')}</td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id}>
                      <td className="font-medium text-white">{member.full_name}</td>
                      <td>{member.tenant?.name ?? '—'}</td>
                      <td className="font-mono text-sm">{member.email}</td>
                      <td>{resolveMemberFunction(member)}</td>
                      <td>
                        <StatusBadge status={member.status} />
                      </td>
                      <td>
                        <StatusToggle
                          member={member}
                          disabled={togglingId === member.id}
                          onToggle={handleToggleStatus}
                          t={t}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
