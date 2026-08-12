import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import PermissionToggle from '../../components/PermissionToggle'
import NeonButton from '../../components/prodigy/NeonButton'
import PageShell from '../../components/prodigy/PageShell'
import Reveal from '../../components/prodigy/Reveal'
import { useTranslation } from '../../i18n/LanguageContext'
import { PERMISSION_MODULES } from './mockRoles'
import {
  ALL_PERMISSION_IDS,
  buildRolePermissionsState,
  createCustomRole,
  getAllRoles,
  getRoleById,
  getRoleDescription,
  getRoleLabel,
  persistRolePermissions,
} from './rolesStore'

export default function RolesPage() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState(() => getAllRoles())
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? 'super_admin')
  const [rolePermissions, setRolePermissions] = useState(() => buildRolePermissionsState())
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    persistRolePermissions(rolePermissions)
  }, [rolePermissions])

  const selectedRole = useMemo(
    () => getRoleById(selectedRoleId),
    [selectedRoleId, roles],
  )

  const activePermissions = rolePermissions[selectedRoleId] ?? []

  function refreshRoles() {
    setRoles(getAllRoles())
  }

  function togglePermission(permissionId) {
    setRolePermissions((current) => {
      const next = { ...current }
      const set = new Set(next[selectedRoleId] ?? [])

      if (set.has(permissionId)) {
        set.delete(permissionId)
      } else {
        set.add(permissionId)
      }

      next[selectedRoleId] = [...set]
      return next
    })
  }

  function openCreateModal() {
    setCreateForm({ name: '', description: '' })
    setCreateError('')
    setCreateOpen(true)
  }

  function handleCreateRole(event) {
    event.preventDefault()

    const name = createForm.name.trim()
    if (!name) {
      setCreateError(t('roles.form.nameRequired'))
      return
    }

    const role = createCustomRole(name, createForm.description)
    refreshRoles()
    setRolePermissions((current) => ({
      ...current,
      [role.id]: [],
    }))
    setSelectedRoleId(role.id)
    setCreateOpen(false)
  }

  return (
    <PageShell
      wide
      compact
      title={t('roles.title')}
      actions={<NeonButton onClick={openCreateModal}>{t('roles.createRole')}</NeonButton>}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Reveal className="pg-panel p-4 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--pg-text-dim)]">
              {t('roles.directoryTitle')}
            </h2>
            <span className="rounded-full border border-[var(--pg-border)] px-2 py-0.5 text-[10px] font-bold text-[var(--pg-accent)]">
              {roles.length}
            </span>
          </div>

          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {roles.map((role) => {
              const isActive = role.id === selectedRoleId

              return (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={`pg-list-item ${isActive ? 'is-active' : ''}`}
                  >
                    <span className="block truncate text-sm font-semibold">
                      {getRoleLabel(role, t)}
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}
                    >
                      {getRoleDescription(role, t)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Reveal>

        <Reveal delay={0.08} className="pg-panel p-5 lg:col-span-2">
          <div className="mb-6 border-b border-[var(--pg-border)] pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--pg-font-display)] text-lg font-bold uppercase tracking-wide text-white">
                  {getRoleLabel(selectedRole, t)}
                </h2>
                <p className="mt-1 text-sm text-[var(--pg-text-muted)]">
                  {getRoleDescription(selectedRole, t)}
                </p>
              </div>
              <span className="pg-status-pill is-open">
                {t('roles.activeCount', {
                  count: activePermissions.length,
                  total: ALL_PERMISSION_IDS.length,
                })}
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PERMISSION_MODULES.map((module) => (
              <article key={module.id} className="pg-panel-muted p-4">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pg-accent)]">
                  {t(module.labelKey)}
                </h3>
                <ul className="m-0 flex list-none flex-col p-0">
                  {module.permissions.map((permission) => {
                    const checked = activePermissions.includes(permission.id)
                    const label = t(permission.labelKey)

                    return (
                      <li
                        key={permission.id}
                        className="flex items-center justify-between gap-3 border-b border-[var(--pg-border)]/70 py-2.5 last:border-0"
                      >
                        <span className="text-sm text-slate-300">{label}</span>
                        <PermissionToggle
                          checked={checked}
                          onChange={() => togglePermission(permission.id)}
                          label={label}
                        />
                      </li>
                    )
                  })}
                </ul>
              </article>
            ))}
          </div>
        </Reveal>
      </div>

      <Modal title={t('roles.form.title')} open={createOpen} onClose={() => setCreateOpen(false)}>
        <form className="stack" onSubmit={handleCreateRole}>
          <label>
            {t('roles.form.name')} *
            <input
              value={createForm.name}
              onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
              placeholder={t('roles.form.namePlaceholder')}
              required
            />
          </label>
          <label>
            {t('roles.form.description')}
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })}
              placeholder={t('roles.form.descriptionPlaceholder')}
            />
          </label>
          {createError ? <p className="error">{createError}</p> : null}
          <button type="submit">{t('roles.form.create')}</button>
        </form>
      </Modal>
    </PageShell>
  )
}
