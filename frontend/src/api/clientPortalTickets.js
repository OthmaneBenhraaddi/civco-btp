import api from './client'

function unwrap(data) {
  return data?.data ?? data
}

export async function fetchPortalTickets(params = {}) {
  const { data } = await api.get('/api/v1/client-portal/tickets', { params })
  return data
}

export async function fetchPortalTicket(id) {
  const { data } = await api.get(`/api/v1/client-portal/tickets/${id}`)
  return unwrap(data)
}

export async function createPortalTicket(payload) {
  const { data } = await api.post('/api/v1/client-portal/tickets', payload)
  return unwrap(data)
}

export async function replyToPortalTicket(id, body) {
  const { data } = await api.post(`/api/v1/client-portal/tickets/${id}/messages`, { body })
  return unwrap(data)
}
