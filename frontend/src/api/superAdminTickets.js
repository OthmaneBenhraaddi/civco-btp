import api from './client'

function unwrap(data) {
  return data?.data ?? data
}

export async function fetchCmsTickets(params = {}) {
  const { data } = await api.get('/api/v1/super-admin/tickets', { params })
  return data
}

export async function fetchCmsTicket(id) {
  const { data } = await api.get(`/api/v1/super-admin/tickets/${id}`)
  return unwrap(data)
}

export async function createCmsTicket(payload) {
  const { data } = await api.post('/api/v1/super-admin/tickets', payload)
  return unwrap(data)
}

export async function replyToCmsTicket(id, body) {
  const { data } = await api.post(`/api/v1/super-admin/tickets/${id}/messages`, { body })
  return unwrap(data)
}

export async function closeCmsTicket(id) {
  const { data } = await api.post(`/api/v1/super-admin/tickets/${id}/close`)
  return unwrap(data)
}
