import api from './client'

export async function fetchTenants(params = {}) {
  const { data } = await api.get('/api/v1/super-admin/tenants', { params })
  return data
}

export async function fetchSuperAdminStats() {
  const { data } = await api.get('/api/v1/super-admin/stats')
  return data
}

export async function updateTenant(tenantId, payload) {
  const { data } = await api.patch(`/api/v1/super-admin/tenants/${tenantId}`, payload)
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

  const optionalFields = [
    'custom_domain',
    'mail_from_address',
    'mail_host',
    'mail_port',
    'mail_username',
    'mail_password',
    'mail_encryption',
  ]

  optionalFields.forEach((field) => {
    const value = payload[field]
    if (value !== undefined && value !== null && value !== '') {
      formData.append(field, String(value))
    }
  })

  const { data } = await api.post('/api/v1/super-admin/tenants', formData)
  return data
}

export async function createTenantAdmin(tenantId, payload) {
  const { data } = await api.post(`/api/v1/super-admin/tenants/${tenantId}/admins`, payload)
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
