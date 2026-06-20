import api from './client'

export async function fetchMe(companyId) {
  const { data } = await api.get('/api/v1/me', {
    params: companyId ? { company_id: companyId } : undefined,
  })
  return data
}
