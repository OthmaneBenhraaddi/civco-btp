import { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import PermissionToggle from '../../components/PermissionToggle'
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

function roleItemClasses(isActive) {
  const base = [
    'role-list-item flex w-full flex-col rounded-lg border px-3 py-2.5 text-left',
    'transition-all duration-150 ease-in-out',
  ]

  if (isActive) {
    base.push(
      'role-list-item-active border-l-2 border-blue-500 border-slate-700/50 bg-white/[0.06] pl-2.5 text-white',
    )
  } else {
    base.push('border-transparent bg-transparent text-slate-400 hover:bg-white/[0.03] hover:text-slate-200')
  }

  return base.join(' ')
}

export default function RolesSettingsPanel() {
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
    <div className="roles-settings-panel mx-auto flex max-w-[1400px] flex-col gap-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="rounded-xl border border-slate-800/60 bg-[#111214] p-4 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {t('roles.directoryTitle')}
            </h2>
            <button
              type="button"
              onClick={openCreateModal}
              className="roles-create-btn rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500"
            >
              {t('roles.createRole')}
            </button>
          </div>

          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {roles.map((role) => {
              const isActive = role.id === selectedRoleId

              return (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={roleItemClasses(isActive)}
                  >
                    <span className="block truncate text-sm font-medium">{getRoleLabel(role, t)}</span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${isActive ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {getRoleDescription(role, t)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <section className="rounded-xl border border-slate-800/60 bg-[#111214] p-5 lg:col-span-2">
          <div className="mb-6 border-b border-slate-800/60 pb-4">
            <h2 className="text-lg font-semibold text-white">{getRoleLabel(selectedRole, t)}</h2>
            <p className="mt-1 text-sm text-slate-400">{getRoleDescription(selectedRole, t)}</p>
            <p className="mt-2 text-xs text-slate-500">
              {t('roles.activeCount', { count: activePermissions.length, total: ALL_PERMISSION_IDS.length })}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {PERMISSION_MODULES.map((module) => (
              <article
                key={module.id}
                className="rounded-xl border border-slate-800/50 bg-[#0d0e11]/80 p-4"
              >
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t(module.labelKey)}
                </h3>
                <ul className="m-0 flex list-none flex-col p-0">
                  {module.permissions.map((permission) => {
                    const checked = activePermissions.includes(permission.id)
                    const label = t(permission.labelKey)

                    return (
                      <li
                        key={permission.id}
                        className="flex items-center justify-between gap-3 border-b border-slate-800/40 py-2.5 last:border-0"
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
        </section>
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
    </div>
  )
}
