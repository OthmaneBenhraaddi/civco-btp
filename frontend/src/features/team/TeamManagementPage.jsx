import { useCallback, useEffect, useMemo, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import ConfirmArchiveModal from '../../components/ConfirmArchiveModal'
import Modal from '../../components/Modal'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { useDemoGuards } from '../../hooks/useDemoGuards'
import { useActionToast } from '../../hooks/useActionToast'
import * as rolesApi from '../../api/roles'
import * as teamMembersApi from '../../api/teamMembers'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { isPlatformSuperAdmin } from '../../utils/authIdentity'
import { FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { filterTeamAssignableRoles, resolveMemberFunction } from './teamRoleUtils'
import { TEAM_DIRECTORY_REFRESH_EVENT } from '../profile/profileSyncEvents'
import { TEAM_COC_CLASS } from './teamTheme'
import './teamCoc.css'

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

function canArchiveMember(member, currentUser, isSuperAdmin) {
  if (member.status === 'archived') {
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
    return (
      <span className="block truncate" title={resolveMemberFunction(member)}>
        {resolveMemberFunction(member)}
      </span>
    )
  }

  return (
    <CutSelect
      size="sm"
      align="right"
      className="w-full max-w-full min-w-0"
      value={currentRoleId ? String(currentRoleId) : ''}
      disabled={updating || rolesLoading || roleOptions.length === 0}
      placeholder={rolesLoading ? t('common.loading') : t('team.role')}
      options={roleOptions.map((role) => ({
        value: String(role.id),
        label: role.name,
      }))}
      onChange={(nextValue) => {
        const nextRoleId = Number(nextValue)

        if (!nextRoleId || nextRoleId === Number(currentRoleId)) {
          return
        }

        onChange(member.id, nextRoleId)
      }}
    />
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

function IconUserOff({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M17 8l5 5M22 8l-5 5" strokeLinecap="round" />
    </svg>
  )
}

function IconUserCheck({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M16 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlus({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

const actionBtnClass =
  'team-action-btn inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-50'

function MemberActions({
  member,
  toggling,
  canToggle,
  canArchive,
  onToggle,
  onArchive,
  t,
}) {
  const isActive = member.status === 'active'

  return (
    <div className="flex items-center justify-end gap-1.5">
      {member.status !== 'archived' && canToggle ? (
        <button
          type="button"
          disabled={toggling}
          title={isActive ? t('team.deactivateAccess') : t('team.activateAccess')}
          aria-label={isActive ? t('team.deactivateAccess') : t('team.activateAccess')}
          onClick={() => onToggle(member.id)}
          className={[
            actionBtnClass,
            isActive
              ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15',
          ].join(' ')}
        >
          {isActive ? <IconUserOff className="h-3.5 w-3.5" /> : <IconUserCheck className="h-3.5 w-3.5" />}
        </button>
      ) : null}
      {canArchive ? (
        <button
          type="button"
          title={t('team.archive')}
          aria-label={t('team.archive')}
          onClick={() => onArchive(member)}
          className={`${actionBtnClass} border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15`}
        >
          <IconArchive className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export default function TeamManagementPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { blockDestructive } = useDemoGuards()
  const { toastSuccess, toastUpdated, toastError } = useActionToast()
  const isSuperAdmin = isPlatformSuperAdmin(user)

  const [tenants, setTenants] = useState([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [assignableRoles, setAssignableRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(!isSuperAdmin)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [addOpen, setAddOpen] = useState(false)
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

  function resetForm() {
    setForm({
      ...emptyForm,
      role_id: selectedRole
        ? String(selectedRole.id)
        : (assignableRoles[0] ? String(assignableRoles[0].id) : ''),
    })
  }

  function handleCloseAdd() {
    setAddOpen(false)
    resetForm()
  }

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
      resetForm()
      setAddOpen(false)
      setSuccess(t('team.createdSuccess'))
      toastSuccess(t('toast.messages.teamCreated'))
      await loadMembers()
    } catch (err) {
      setError(extractErrorMessage(err, t('team.createError')))
      toastError(extractErrorMessage(err, t('team.createError')))
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
      toastUpdated(t('toast.messages.teamRoleUpdated'))
    } catch (err) {
      setError(extractErrorMessage(err, t('team.roleUpdateError')))
      toastError(extractErrorMessage(err, t('team.roleUpdateError')))
      await loadMembers()
    } finally {
      setUpdatingRoleId(null)
    }
  }

  async function confirmArchiveMember() {
    if (!archiveTarget) {
      return
    }

    if (blockDestructive(t('team.archive'))) {
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
    <div className={`list-page team ${TEAM_COC_CLASS}`.trim()}>
      <header className="page-header">
        <div>
          <h1>{t('team.title')}</h1>
          <p>{isSuperAdmin ? t('team.subtitleSuperAdmin') : t('team.subtitle')}</p>
        </div>
        {!isSuperAdmin ? (
          <NeonButton type="button" onClick={() => setAddOpen(true)}>
            <IconPlus className="h-4 w-4" />
            {t('team.addMember')}
          </NeonButton>
        ) : null}
      </header>

      {isSuperAdmin ? (
        <section className="card mb-6 p-4">
          <label className={LABEL_CLASS}>
            {t('team.filterByEntity')}
            <CutSelect
              className="mt-2 w-full max-w-md"
              value={selectedTenantId}
              options={tenants.map((tenant) => ({
                value: String(tenant.id),
                label: `${tenant.name} (${tenant.subdomain})`,
              }))}
              onChange={(next) => setSelectedTenantId(next)}
            />
          </label>
        </section>
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="hint text-emerald-400">{success}</p> : null}

      <section className="card w-full min-w-0 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">{t('team.membersList')}</h2>
        {loading ? (
          <p>{t('common.loading')}</p>
        ) : (
          <div className="team-members-table w-full min-w-0 overflow-hidden">
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-[17%]" />
                <col className="w-[11%]" />
                <col className="w-[13%]" />
                <col className="w-[22%]" />
                <col className="w-[17%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr>
                  <th className="truncate">{t('team.fullName')}</th>
                  <th className="truncate">{t('team.cin')}</th>
                  <th className="truncate">{t('team.phone')}</th>
                  <th className="truncate">{t('team.email')}</th>
                  <th className="truncate">{t('team.role')}</th>
                  <th className="truncate">{t('team.status')}</th>
                  <th className="truncate text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={7}>{t('team.empty')}</td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr
                      key={member.id}
                      className={member.status === 'archived' ? 'opacity-55' : undefined}
                    >
                      <td className="truncate" title={member.full_name}>
                        {member.full_name}
                      </td>
                      <td className="truncate font-mono text-sm" title={member.cin ?? undefined}>
                        {member.cin ?? '—'}
                      </td>
                      <td className="truncate" title={member.phone ?? undefined}>
                        {member.phone ?? '—'}
                      </td>
                      <td className="truncate font-mono text-sm" title={member.email}>
                        {member.email}
                      </td>
                      <td className="min-w-0 overflow-hidden">
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
                        <MemberActions
                          member={member}
                          toggling={togglingId === member.id}
                          canToggle={canToggleMemberStatus(member, user, isSuperAdmin)}
                          canArchive={canArchiveMember(member, user, isSuperAdmin)}
                          onToggle={handleToggleStatus}
                          onArchive={setArchiveTarget}
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

      {!isSuperAdmin ? (
        <Modal
          title={t('team.addMember')}
          open={addOpen}
          onClose={handleCloseAdd}
          panelClassName="max-w-lg"
        >
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
              <CutSelect
                className="w-full"
                size="sm"
                value={form.role_id}
                disabled={rolesLoading || assignableRoles.length === 0}
                placeholder={rolesLoading ? t('common.loading') : t('team.role')}
                options={assignableRoles.map((role) => ({
                  value: String(role.id),
                  label: role.name,
                }))}
                onChange={(nextValue) => handleRoleChange(nextValue)}
              />
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
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <NeonButton type="button" variant="ghost" onClick={handleCloseAdd}>
                {t('common.cancel')}
              </NeonButton>
              <NeonButton
                type="submit"
                disabled={saving || rolesLoading || assignableRoles.length === 0}
                className={saving || rolesLoading || assignableRoles.length === 0 ? 'opacity-45' : ''}
              >
                {saving ? t('team.creating') : t('team.create')}
              </NeonButton>
            </div>
          </form>
        </Modal>
      ) : null}

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
