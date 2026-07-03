import api from './client'

export async function fetchPermissions() {
  const { data } = await api.get('/api/v1/permissions')
  return data
}

export async function fetchRoles() {
  const { data } = await api.get('/api/v1/roles')
  return data
}

export async function createRole(payload) {
  const { data } = await api.post('/api/v1/roles', payload)
  return data
}

export async function updateRole(roleId, payload) {
  const { data } = await api.put(`/api/v1/roles/${roleId}`, payload)
  return data
}

export async function deleteRole(roleId) {
  const { data } = await api.delete(`/api/v1/roles/${roleId}`)
  return data
}
