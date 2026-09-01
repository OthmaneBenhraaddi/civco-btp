import api from './client'

export async function redeemDemoCode(code) {
  const { data } = await api.post('/api/v1/demo/redeem', { code })
  return data
}

export async function submitDemoRequest(payload) {
  const { data } = await api.post('/api/v1/demo/requests', payload)
  return data
}

export async function fetchDemoCodes(params = {}) {
  const { data } = await api.get('/api/v1/super-admin/demo-codes', { params })
  return data
}

export async function createDemoCode(payload) {
  const { data } = await api.post('/api/v1/super-admin/demo-codes', payload)
  return data
}

export async function revokeDemoCode(id) {
  const { data } = await api.delete(`/api/v1/super-admin/demo-codes/${id}`)
  return data
}

export async function fetchDemoRequests(params = {}) {
  const { data } = await api.get('/api/v1/super-admin/demo-requests', { params })
  return data
}

export async function updateDemoRequestStatus(id, status) {
  const { data } = await api.patch(`/api/v1/super-admin/demo-requests/${id}`, { status })
  return data
}

export async function deleteDemoRequest(id) {
  const { data } = await api.delete(`/api/v1/super-admin/demo-requests/${id}`)
  return data
}
