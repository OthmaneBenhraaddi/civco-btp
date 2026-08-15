import api from './client'

function unwrap(data) {
  return data?.data ?? data
}

export async function fetchTickets(params = {}) {
  const { data } = await api.get('/api/v1/tickets', { params })
  return data
}

export async function fetchTicket(id) {
  const { data } = await api.get(`/api/v1/tickets/${id}`)
  return unwrap(data)
}

export async function createTicket(payload) {
  const { data } = await api.post('/api/v1/tickets', payload)
  return unwrap(data)
}

export async function replyToTicket(id, body) {
  const { data } = await api.post(`/api/v1/tickets/${id}/messages`, { body })
  return unwrap(data)
}

export async function closeTicket(id) {
  const { data } = await api.post(`/api/v1/tickets/${id}/close`)
  return unwrap(data)
}
