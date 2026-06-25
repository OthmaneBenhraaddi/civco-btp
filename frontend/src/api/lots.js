import api from './client'

export async function fetchLots(params = {}) {
  const { data } = await api.get('/api/v1/lots', { params })
  return data
}

export async function createLot(payload) {
  const { data } = await api.post('/api/v1/lots', payload)
  return data
}

export async function updateLot(id, payload) {
  const { data } = await api.put(`/api/v1/lots/${id}`, payload)
  return data
}

export async function deleteLot(id) {
  const { data } = await api.delete(`/api/v1/lots/${id}`)
  return data
}
