import api from './client'

export async function redeemDemoCode(code) {
  const { data } = await api.post('/api/v1/demo/redeem', { code })
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
