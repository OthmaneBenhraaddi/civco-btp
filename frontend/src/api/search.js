import api from './client'

export async function globalSearch(query, params = {}) {
  const { data } = await api.get('/api/v1/search', {
    params: { q: query, ...params },
  })
  return data
}
