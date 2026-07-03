import api from './client'

export async function fetchTenants(params = {}) {
  const { data } = await api.get('/api/v1/super-admin/tenants', { params })
  return data
}

export async function createTenant(payload) {
  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('subdomain', payload.subdomain)
  formData.append('status', payload.status)

  if (payload.logo) {
    formData.append('logo', payload.logo)
  }

  const { data } = await api.post('/api/v1/super-admin/tenants', formData)
  return data
}

export async function updateTenantStatus(tenantId, status) {
  const { data } = await api.patch(`/api/v1/super-admin/tenants/${tenantId}/status`, { status })
  return data
}

export async function updateTenantAdminStatus(tenantId, userId, status) {
  const { data } = await api.patch(
    `/api/v1/super-admin/tenants/${tenantId}/admins/${userId}/status`,
    { status },
  )
  return data
}

export async function fetchAdminCredentials(tenantId, userId) {
  const { data } = await api.get(
    `/api/v1/super-admin/tenants/${tenantId}/admins/${userId}/credentials`,
  )
  return data
}

export async function resetAdminPassword(tenantId, userId) {
  const { data } = await api.post(
    `/api/v1/super-admin/tenants/${tenantId}/admins/${userId}/reset-password`,
  )
  return data
}
