import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal from '../../components/Modal'
import PermissionToggle from '../../components/PermissionToggle'
import { useTranslation } from '../../i18n/LanguageContext'
import * as rolesApi from '../../api/roles'
import { extractErrorMessage } from '../../utils/apiHelpers'

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

function groupPermissions(permissions) {
  const groups = new Map()

  for (const permission of permissions) {
    const moduleKey = permission.module ?? 'other'
    if (!groups.has(moduleKey)) {
      groups.set(moduleKey, [])
    }
    groups.get(moduleKey).push(permission)
  }

  return [...groups.entries()].map(([id, items]) => ({
    id,
    label: id,
    permissions: items,
  }))
}

export default function RolesSettingsPanel() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedRoleId, setSelectedRoleId] = useState(null)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [createError, setCreateError] = useState('')

  const permissionModules = useMemo(() => groupPermissions(permissions), [permissions])

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  )

  const isSystemRole = Boolean(selectedRole?.is_system)
  const isCustomRole = selectedRole && !selectedRole.is_system

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [rolesResponse, permissionsResponse] = await Promise.all([
        rolesApi.fetchRoles(),
        rolesApi.fetchPermissions(),
      ])

      const nextRoles = rolesResponse.data ?? []
      const nextPermissions = permissionsResponse.data ?? []

      setRoles(nextRoles)
      setPermissions(nextPermissions)

      setSelectedRoleId((current) => {
        if (current && nextRoles.some((role) => role.id === current)) {
          return current
        }

        return nextRoles[0]?.id ?? null
      })
    } catch (err) {
      setError(extractErrorMessage(err, t('roles.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!selectedRole) {
      setSelectedPermissionIds([])
      return
    }

    setSelectedPermissionIds((selectedRole.permissions ?? []).map((permission) => permission.id))
  }, [selectedRole])

  async function persistPermissions(nextIds) {
    if (!selectedRole || isSystemRole) return

    setSaving(true)
    setError('')

    try {
      const response = await rolesApi.updateRole(selectedRole.id, {
        permission_ids: nextIds,
      })
      const updated = response.data ?? response

      setRoles((current) => current.map((role) => (role.id === updated.id ? updated : role)))
      setSelectedPermissionIds((updated.permissions ?? []).map((permission) => permission.id))
    } catch (err) {
      setError(extractErrorMessage(err, t('roles.saveError')))
    } finally {
      setSaving(false)
    }
  }

  function togglePermission(permissionId) {
    if (isSystemRole) return

    const next = new Set(selectedPermissionIds)
    if (next.has(permissionId)) {
      next.delete(permissionId)
    } else {
      next.add(permissionId)
    }

    const nextIds = [...next]
    setSelectedPermissionIds(nextIds)
    persistPermissions(nextIds)
  }

  function openCreateModal() {
    setCreateForm({ name: '', description: '' })
    setCreateError('')
    setCreateOpen(true)
  }

  async function handleCreateRole(event) {
    event.preventDefault()

    const name = createForm.name.trim()
    if (!name) {
      setCreateError(t('roles.form.nameRequired'))
      return
    }

    setCreateError('')

    try {
      const response = await rolesApi.createRole({
        name,
        description: createForm.description.trim() || null,
        permission_ids: [],
      })
      const created = response.data ?? response

      setRoles((current) => [...current, created])
      setSelectedRoleId(created.id)
      setCreateOpen(false)
    } catch (err) {
      setCreateError(extractErrorMessage(err, t('roles.saveError')))
    }
  }

  async function handleDeleteRole() {
    if (!isCustomRole) return

    if (!window.confirm(t('roles.deleteConfirm', { name: selectedRole.name }))) {
      return
    }

    setError('')

    try {
      await rolesApi.deleteRole(selectedRole.id)
      const remaining = roles.filter((role) => role.id !== selectedRole.id)
      setRoles(remaining)
      setSelectedRoleId(remaining[0]?.id ?? null)
    } catch (err) {
      setError(extractErrorMessage(err, t('roles.deleteError')))
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">{t('common.loading')}</p>
  }

  return (
    <div className="roles-settings-panel mx-auto flex max-w-[1400px] flex-col gap-y-6">
      {error ? <p className="error">{error}</p> : null}

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
                    <span className="block truncate text-sm font-medium">{role.name}</span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${isActive ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                      {role.description || role.slug}
                      {role.is_system ? ` · ${t('roles.systemRole')}` : ''}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <section className="rounded-xl border border-slate-800/60 bg-[#111214] p-5 lg:col-span-2">
          {selectedRole ? (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/60 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedRole.name}</h2>
                  <p className="mt-1 text-sm text-slate-400">{selectedRole.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {t('roles.activeCount', {
                      count: selectedPermissionIds.length,
                      total: permissions.length,
                    })}
                    {saving ? ` · ${t('common.saving')}` : ''}
                  </p>
                  {isSystemRole ? (
                    <p className="mt-2 text-xs text-amber-400/90">{t('roles.systemRoleHint')}</p>
                  ) : null}
                </div>
                {isCustomRole ? (
                  <button
                    type="button"
                    onClick={handleDeleteRole}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    {t('common.delete')}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {permissionModules.map((module) => (
                  <article
                    key={module.id}
                    className="rounded-xl border border-slate-800/50 bg-[#0d0e11]/80 p-4"
                  >
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {t(`roles.modules.${module.id}`, module.label)}
                    </h3>
                    <ul className="m-0 flex list-none flex-col p-0">
                      {module.permissions.map((permission) => {
                        const checked = selectedPermissionIds.includes(permission.id)
                        const label = permission.name

                        return (
                          <li
                            key={permission.id}
                            className="flex items-center justify-between gap-3 border-b border-slate-800/40 py-2.5 last:border-0"
                          >
                            <span className="text-sm text-slate-300">{label}</span>
                            <PermissionToggle
                              checked={checked}
                              disabled={isSystemRole || saving}
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
            </>
          ) : (
            <p className="text-sm text-slate-500">{t('roles.empty')}</p>
          )}
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
