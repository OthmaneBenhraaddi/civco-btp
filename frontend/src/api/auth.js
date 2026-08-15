import api, { ensureCsrfCookie } from './client'

export async function login(credentials) {
  await ensureCsrfCookie()
  const { data } = await api.post('/api/v1/login', credentials)
  return data
}

export async function logout() {
  await ensureCsrfCookie()
  const { data } = await api.post('/api/v1/logout')
  return data
}

export async function fetchMe(companyId) {
  const { data } = await api.get('/api/v1/me', {
    params: companyId ? { company_id: companyId } : undefined,
  })
  return data
}

export async function updateProfile(payload) {
  const { data } = await api.patch('/api/v1/me', payload)
  return data
}

export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)
  const { data } = await api.post('/api/v1/me/avatar', formData)
  return data
}

export async function deleteAvatar() {
  const { data } = await api.delete('/api/v1/me/avatar')
  return data
}
