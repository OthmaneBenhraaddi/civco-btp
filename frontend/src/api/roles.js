import api from './client'

let cachedSettings = null
let settingsPromise = null

export async function fetchPermissions() {
  const { data } = await api.get('/api/v1/permissions')
  return data
}

export async function fetchRoles() {
  const { data } = await api.get('/api/v1/roles')
  return data
}

/** Single round-trip for the roles settings panel (roles + permission catalog). */
export async function fetchRoleSettings({ force = false } = {}) {
  if (!force && cachedSettings) {
    return cachedSettings
  }

  if (!force && settingsPromise) {
    return settingsPromise
  }

  settingsPromise = api.get('/api/v1/roles/settings')
    .then(({ data }) => {
      cachedSettings = data
      return data
    })
    .finally(() => {
      settingsPromise = null
    })

  return settingsPromise
}

export function prefetchRoleSettings() {
  return fetchRoleSettings().catch(() => null)
}

export function invalidateRoleSettingsCache() {
  cachedSettings = null
  settingsPromise = null
}

export async function createRole(payload) {
  const { data } = await api.post('/api/v1/roles', payload)
  invalidateRoleSettingsCache()
  return data
}

export async function updateRole(roleId, payload) {
  const { data } = await api.put(`/api/v1/roles/${roleId}`, payload)
  invalidateRoleSettingsCache()
  return data
}

export async function deleteRole(roleId) {
  const { data } = await api.delete(`/api/v1/roles/${roleId}`)
  invalidateRoleSettingsCache()
  return data
}
