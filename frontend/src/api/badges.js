import api from './client'

export async function fetchBadges(params = {}) {
  const { data } = await api.get('/api/v1/badges', { params })
  return data
}

export async function createBadge(payload) {
  const { data } = await api.post('/api/v1/badges', payload)
  return data
}

export async function updateBadge(id, payload) {
  const { data } = await api.put(`/api/v1/badges/${id}`, payload)
  return data
}

export async function deleteBadge(id) {
  const { data } = await api.delete(`/api/v1/badges/${id}`)
  return data
}
