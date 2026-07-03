import api from './client'

export async function fetchTenantLogo() {
  const { data } = await api.get('/api/v1/tenant/logo')
  return data
}

export async function uploadTenantLogo(file) {
  const formData = new FormData()
  formData.append('logo', file)

  const { data } = await api.post('/api/v1/tenant/logo', formData)
  return data
}
