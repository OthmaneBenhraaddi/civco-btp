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
