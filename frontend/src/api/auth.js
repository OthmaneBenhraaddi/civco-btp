import api, { ensureCsrfCookie } from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function login(credentials) {
  if (isUiOnlyMode()) return stubs.login(credentials)
  await ensureCsrfCookie()
  const { data } = await api.post('/api/v1/login', credentials)
  return data
}

export async function logout() {
  if (isUiOnlyMode()) return stubs.logout()
  await ensureCsrfCookie()
  const { data } = await api.post('/api/v1/logout')
  return data
}

export async function fetchMe(companyId) {
  if (isUiOnlyMode()) return stubs.fetchMe(companyId)
  const { data } = await api.get('/api/v1/me', {
    params: companyId ? { company_id: companyId } : undefined,
  })
  return data
}
