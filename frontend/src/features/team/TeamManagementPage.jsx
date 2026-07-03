import { useCallback, useEffect, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as teamMembersApi from '../../api/teamMembers'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { isPlatformSuperAdmin } from '../../utils/authIdentity'
import { BTN_PRIMARY, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'

const emptyForm = {
  first_name: '',
  last_name: '',
  cin: '',
  phone: '',
  email: '',
  password: '',
  role: 'technicien',
  job_title: '',
}

const TEAM_ROLE_OPTIONS = [
  { value: 'admin', labelKey: 'team.roles.admin', jobTitleKey: 'team.jobTitles.admin' },
  { value: 'technicien', labelKey: 'team.roles.technicien', jobTitleKey: 'team.jobTitles.technicien' },
  { value: 'comptable', labelKey: 'team.roles.comptable', jobTitleKey: 'team.jobTitles.comptable' },
]

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

function resolveJobTitle(member, t) {
  if (member.job_title) {
    return member.job_title
  }

  if (member.role === 'admin') {
    return t('team.jobTitles.admin')
  }

  const slug = member.roles?.[0]?.slug

  if (slug === 'accountant') {
    return t('team.jobTitles.comptable')
  }

  return t('team.jobTitles.technicien')
}

export default function TeamManagementPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isSuperAdmin = isPlatformSuperAdmin(user)

  const [tenants, setTenants] = useState([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [members, setMembers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    if (isSuperAdmin && !selectedTenantId) {
      setMembers([])
      setLoading(false)
      return
    }

    loadMembers()
  }, [isSuperAdmin, selectedTenantId, loadMembers])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const roleOption = TEAM_ROLE_OPTIONS.find((option) => option.value === form.role)

    try {
      await teamMembersApi.createTeamMember({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        cin: form.cin.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        job_title: form.job_title.trim() || (roleOption ? t(roleOption.jobTitleKey) : undefined),
      })
      setForm(emptyForm)
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
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                >
                  {TEAM_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={LABEL_CLASS}>
                {t('team.jobTitle')}
                <input
                  className={FIELD_CLASS}
                  value={form.job_title}
                  onChange={(event) => setForm({ ...form, job_title: event.target.value })}
                  placeholder={t(TEAM_ROLE_OPTIONS.find((option) => option.value === form.role)?.jobTitleKey ?? 'team.jobTitles.technicien')}
                />
              </label>
              <button type="submit" className={BTN_PRIMARY} disabled={saving}>
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
                    {isSuperAdmin ? <th>{t('team.password')}</th> : null}
                    <th>{t('team.jobTitle')}</th>
                    <th>{t('team.status')}</th>
                    <th>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 8 : 7}>{t('team.empty')}</td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id}>
                        <td>{member.full_name}</td>
                        <td className="font-mono text-sm">{member.cin ?? '—'}</td>
                        <td>{member.phone ?? '—'}</td>
                        <td className="font-mono text-sm">{member.email}</td>
                        {isSuperAdmin ? (
                          <td>
                            <PasswordCell
                              password={member.stored_password}
                              hasStored={member.has_stored_credentials}
                              canReveal={isSuperAdmin}
                              t={t}
                            />
                          </td>
                        ) : null}
                        <td>{resolveJobTitle(member, t)}</td>
                        <td>
                          <StatusBadge status={member.status} />
                        </td>
                        <td>
                          <StatusToggle
                            member={member}
                            disabled={togglingId === member.id}
                            canToggle={canToggleMemberStatus(member, user, isSuperAdmin)}
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
    </div>
  )
}
