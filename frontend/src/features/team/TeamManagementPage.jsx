import { useCallback, useEffect, useMemo, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import ConfirmArchiveModal from '../../components/ConfirmArchiveModal'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as rolesApi from '../../api/roles'
import * as teamMembersApi from '../../api/teamMembers'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { isPlatformSuperAdmin } from '../../utils/authIdentity'
import { BTN_PRIMARY, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { filterTeamAssignableRoles, resolveMemberFunction } from './teamRoleUtils'
import { TEAM_DIRECTORY_REFRESH_EVENT } from '../profile/profileSyncEvents'

const emptyForm = {
  first_name: '',
  last_name: '',
  cin: '',
  phone: '',
  email: '',
  password: '',
  role_id: '',
  job_title: '',
}

function PasswordCell({ password, hasStored, canReveal, t }) {
  const [visible, setVisible] = useState(false)

  if (!canReveal) {
    return (
      <span className="text-xs text-slate-500" title={t('team.credentialsRestricted')}>
        {hasStored ? t('team.credentialsRestricted') : '—'}
      </span>
    )
  }

  if (!hasStored && !password) {
    return <span className="text-slate-500">—</span>
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-amber-300">
        {visible ? (password ?? '—') : '••••••••'}
      </span>
      {password ? (
        <button
          type="button"
          className="rounded border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-white/5"
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? t('team.hidePassword') : t('team.showPassword')}
        </button>
      ) : null}
    </div>
  )
}

function canToggleMemberStatus(member, currentUser, isSuperAdmin) {
  if (currentUser?.id === member.id) {
    return false
  }

  if (member.role === 'admin' && !isSuperAdmin) {
    return false
  }

  return true
}

function canChangeMemberRole(member, currentUser, isSuperAdmin) {
  if (isSuperAdmin) {
    return false
  }

  return canToggleMemberStatus(member, currentUser, isSuperAdmin)
}

function MemberRoleCell({
  member,
  roles,
  rolesLoading,
  canChange,
  updating,
  onChange,
  t,
}) {
  const currentRole = member.roles?.[0] ?? null
  const currentRoleId = currentRole?.id
  const roleOptions = (() => {
    if (!currentRole) {
      return roles
    }

    if (roles.some((role) => Number(role.id) === Number(currentRole.id))) {
      return roles
    }

    return [currentRole, ...roles]
  })()

  if (!canChange) {
    return <span>{resolveMemberFunction(member)}</span>
  }

  return (
    <select
      className={[
        FIELD_CLASS,
        'min-w-[10rem] py-1.5 text-xs',
        updating ? 'cursor-wait opacity-60' : '',
      ].join(' ')}
      value={currentRoleId ? String(currentRoleId) : ''}
      disabled={updating || rolesLoading || roleOptions.length === 0}
      aria-busy={updating}
      aria-label={t('team.role')}
      onChange={(event) => {
        const nextRoleId = Number(event.target.value)

        if (!nextRoleId || nextRoleId === Number(currentRoleId)) {
          return
        }

        onChange(member.id, nextRoleId)
      }}
    >
      {rolesLoading ? (
        <option value="">{t('common.loading')}</option>
      ) : (
        <>
          {!currentRoleId ? <option value="">{t('team.role')}</option> : null}
          {roleOptions.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </>
      )}
    </select>
  )
}

function canArchiveMember(member, currentUser, isSuperAdmin) {
  if (member.status === 'archived') {
    return false
  }

  return canToggleMemberStatus(member, currentUser, isSuperAdmin)
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

function StatusToggle({ member, disabled, canToggle, onToggle, t }) {
  const isActive = member.status === 'active'

  if (!canToggle) {
    return <span className="text-xs text-slate-500">—</span>
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(member.id)}
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

export default function TeamManagementPage() {
  const { t } = useTranslation()
  const { user, isAdmin } = useAuth()
  const isSuperAdmin = isPlatformSuperAdmin(user)
  const canViewTeamCredentials = isSuperAdmin || (isAdmin && Boolean(user?.tenant_id))

  const [tenants, setTenants] = useState([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [assignableRoles, setAssignableRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(!isSuperAdmin)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [updatingRoleId, setUpdatingRoleId] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedRole = useMemo(
    () => assignableRoles.find((role) => String(role.id) === String(form.role_id)) ?? null,
    [assignableRoles, form.role_id],
  )

  const loadAssignableRoles = useCallback(async () => {
    if (isSuperAdmin) {
      return
    }

    setRolesLoading(true)

    try {
      const response = await rolesApi.fetchRoles()
      const nextRoles = filterTeamAssignableRoles(response.data ?? [])
      setAssignableRoles(nextRoles)

      setForm((current) => {
        if (current.role_id && nextRoles.some((role) => String(role.id) === String(current.role_id))) {
          return current
        }

        const defaultRole = nextRoles.find((role) => role.slug === 'collaborator') ?? nextRoles[0]

        return {
          ...current,
          role_id: defaultRole ? String(defaultRole.id) : '',
        }
      })
    } catch (err) {
      setError(extractErrorMessage(err, t('team.rolesLoadError')))
      setAssignableRoles([])
    } finally {
      setRolesLoading(false)
    }
  }, [isSuperAdmin, t])

  const loadMembers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {}

      if (isSuperAdmin && selectedTenantId) {
        params.tenant_id = selectedTenantId
      }

      const data = await teamMembersApi.fetchTeamMembers(params)
      setMembers(data.data ?? data)
    } catch (err) {
      setError(extractErrorMessage(err, t('team.loadError')))
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin, selectedTenantId, t])

  async function refreshTenantOptions() {
    if (!isSuperAdmin) {
      return
    }

    try {
      const data = await teamMembersApi.fetchTeamTenantOptions()
      const list = data.data ?? data
      setTenants(list)
      setSelectedTenantId((current) => {
        if (current && list.some((tenant) => String(tenant.id) === current)) {
          return current
        }

        return list.length > 0 ? String(list[0].id) : ''
      })
    } catch {
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) {
      return
    }

    refreshTenantOptions()
  }, [isSuperAdmin])

  useEffect(() => {
    loadAssignableRoles()
  }, [loadAssignableRoles])

  useEffect(() => {
    if (isSuperAdmin && !selectedTenantId) {
      setMembers([])
      setLoading(false)
      return
    }

    loadMembers()
  }, [isSuperAdmin, selectedTenantId, loadMembers])

  useEffect(() => {
    function handleDirectoryRefresh() {
      loadMembers()
    }

    window.addEventListener(TEAM_DIRECTORY_REFRESH_EVENT, handleDirectoryRefresh)
    return () => window.removeEventListener(TEAM_DIRECTORY_REFRESH_EVENT, handleDirectoryRefresh)
  }, [loadMembers])

  function handleRoleChange(roleId) {
    const role = assignableRoles.find((item) => String(item.id) === String(roleId))

    setForm((current) => ({
      ...current,
      role_id: roleId,
      job_title: current.job_title.trim() === '' ? (role?.name ?? '') : current.job_title,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await teamMembersApi.createTeamMember({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        cin: form.cin.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
        role_id: Number(form.role_id),
        job_title: form.job_title.trim() || selectedRole?.name || undefined,
      })
      setForm({
        ...emptyForm,
        role_id: selectedRole ? String(selectedRole.id) : (assignableRoles[0] ? String(assignableRoles[0].id) : ''),
      })
      setSuccess(t('team.createdSuccess'))
      await loadMembers()
    } catch (err) {
      setError(extractErrorMessage(err, t('team.createError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(userId) {
    setTogglingId(userId)
    setError('')

    try {
      await teamMembersApi.toggleTeamMemberStatus(userId)
      await loadMembers()
    } catch (err) {
      setError(extractErrorMessage(err, t('team.statusError')))
    } finally {
      setTogglingId(null)
    }
  }

  async function handleMemberRoleChange(userId, roleId) {
    setUpdatingRoleId(userId)
    setError('')
    setSuccess('')

    try {
      const response = await teamMembersApi.updateTeamMemberRole(userId, roleId)
      const updatedMember = response.data ?? response

      setMembers((current) => current.map((member) => (
        member.id === userId ? { ...member, ...updatedMember } : member
      )))
      setSuccess(t('team.roleUpdateSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('team.roleUpdateError')))
      await loadMembers()
    } finally {
      setUpdatingRoleId(null)
    }
  }

  async function confirmArchiveMember() {
    if (!archiveTarget) {
      return
    }

    setArchiving(true)
    setError('')
    setSuccess('')

    try {
      const response = await teamMembersApi.archiveTeamMember(archiveTarget.id)
      const updatedMember = response.data ?? response

      setMembers((current) => current.map((member) => (
        member.id === archiveTarget.id ? { ...member, ...updatedMember } : member
      )))
      setSuccess(t('team.archiveSuccess'))
      setArchiveTarget(null)
    } catch (err) {
      setError(extractErrorMessage(err, t('team.archiveError')))
    } finally {
      setArchiving(false)
    }
  }

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('team.title')}</h1>
          <p>{isSuperAdmin ? t('team.subtitleSuperAdmin') : t('team.subtitle')}</p>
        </div>
      </header>

      {isSuperAdmin ? (
        <section className="card mb-6 p-4">
          <label className={LABEL_CLASS}>
            {t('team.filterByEntity')}
            <select
              className={FIELD_CLASS}
              value={selectedTenantId}
              onChange={(event) => setSelectedTenantId(event.target.value)}
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.subdomain})
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="hint text-emerald-400">{success}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {!isSuperAdmin ? (
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">{t('team.addMember')}</h2>
            <form className="stack" onSubmit={handleSubmit}>
              <label className={LABEL_CLASS}>
                {t('team.firstName')}
                <input
                  className={FIELD_CLASS}
                  value={form.first_name}
                  onChange={(event) => setForm({ ...form, first_name: event.target.value })}
                  required
                />
              </label>
              <label className={LABEL_CLASS}>
                {t('team.lastName')}
                <input
                  className={FIELD_CLASS}
                  value={form.last_name}
                  onChange={(event) => setForm({ ...form, last_name: event.target.value })}
                  required
                />
              </label>
              <label className={LABEL_CLASS}>
                {t('team.cin')}
                <input
                  className={FIELD_CLASS}
                  value={form.cin}
                  onChange={(event) => setForm({ ...form, cin: event.target.value })}
                  placeholder="AB123456"
                />
              </label>
              <label className={LABEL_CLASS}>
                {t('team.phone')}
                <input
                  className={FIELD_CLASS}
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+212 6..."
                />
              </label>
              <label className={LABEL_CLASS}>
                {t('team.email')}
                <input
                  type="email"
                  className={FIELD_CLASS}
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </label>
              <label className={LABEL_CLASS}>
                {t('team.password')}
                <input
                  type="password"
                  className={FIELD_CLASS}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  minLength={8}
                  required
                />
              </label>
              <label className={LABEL_CLASS}>
                {t('team.role')}
                <select
                  className={FIELD_CLASS}
                  value={form.role_id}
                  onChange={(event) => handleRoleChange(event.target.value)}
                  required
                  disabled={rolesLoading || assignableRoles.length === 0}
                >
                  {rolesLoading ? (
                    <option value="">{t('common.loading')}</option>
                  ) : (
                    assignableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className={LABEL_CLASS}>
                {t('team.jobTitle')}
                <input
                  className={FIELD_CLASS}
                  value={form.job_title}
                  onChange={(event) => setForm({ ...form, job_title: event.target.value })}
                  placeholder={selectedRole?.name ?? t('team.jobTitlePlaceholder')}
                />
              </label>
              <button
                type="submit"
                className={BTN_PRIMARY}
                disabled={saving || rolesLoading || assignableRoles.length === 0}
              >
                {saving ? t('team.creating') : t('team.create')}
              </button>
            </form>
          </section>
        ) : null}

        <section className={`card p-6 ${isSuperAdmin ? 'xl:col-span-2' : ''}`}>
          <h2 className="mb-4 text-lg font-semibold text-white">{t('team.membersList')}</h2>
          {loading ? (
            <p>{t('common.loading')}</p>
          ) : (
            <div className="table-wrap overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>{t('team.fullName')}</th>
                    <th>{t('team.cin')}</th>
                    <th>{t('team.phone')}</th>
                    <th>{t('team.email')}</th>
                    {canViewTeamCredentials ? <th>{t('team.password')}</th> : null}
                    <th>{t('team.role')}</th>
                    <th>{t('team.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={canViewTeamCredentials ? 8 : 7}>{t('team.empty')}</td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr
                        key={member.id}
                        className={member.status === 'archived' ? 'opacity-55' : undefined}
                      >
                        <td>{member.full_name}</td>
                        <td className="font-mono text-sm">{member.cin ?? '—'}</td>
                        <td>{member.phone ?? '—'}</td>
                        <td className="font-mono text-sm">{member.email}</td>
                        {canViewTeamCredentials ? (
                          <td>
                            <PasswordCell
                              password={member.stored_password}
                              hasStored={member.has_stored_credentials}
                              canReveal={Boolean(member.stored_password) || member.has_stored_credentials}
                              t={t}
                            />
                          </td>
                        ) : null}
                        <td>
                          <MemberRoleCell
                            member={member}
                            roles={assignableRoles}
                            rolesLoading={rolesLoading}
                            canChange={canChangeMemberRole(member, user, isSuperAdmin) && member.status !== 'archived'}
                            updating={updatingRoleId === member.id}
                            onChange={handleMemberRoleChange}
                            t={t}
                          />
                        </td>
                        <td>
                          <StatusBadge status={member.status} />
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-2">
                            {member.status !== 'archived' ? (
                              <StatusToggle
                                member={member}
                                disabled={togglingId === member.id}
                                canToggle={canToggleMemberStatus(member, user, isSuperAdmin)}
                                onToggle={handleToggleStatus}
                                t={t}
                              />
                            ) : null}
                            {canArchiveMember(member, user, isSuperAdmin) ? (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/15"
                                onClick={() => setArchiveTarget(member)}
                              >
                                <IconArchive className="h-3.5 w-3.5" />
                                {t('team.archive')}
                              </button>
                            ) : null}
                          </div>
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

      <ConfirmArchiveModal
        open={Boolean(archiveTarget)}
        title={t('team.archiveConfirmTitle')}
        message={t('team.archiveConfirm', { name: archiveTarget?.full_name ?? '' })}
        confirming={archiving}
        confirmLabel={t('team.archive')}
        cancelLabel={t('common.cancel')}
        confirmingLabel={t('team.archiving')}
        onConfirm={confirmArchiveMember}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  )
}
