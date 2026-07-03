import api from './client'

export async function fetchDispatchNotes(params = {}) {
  const { data } = await api.get('/api/v1/dispatch-notes', { params })
  return data
}

export async function fetchDispatchNote(id) {
  const { data } = await api.get(`/api/v1/dispatch-notes/${id}`)
  return data.data ?? data
}

export async function createDispatchNote(payload) {
  const { data } = await api.post('/api/v1/dispatch-notes', payload)
  return data.data ?? data
}

export async function executeDispatchNote(id) {
  const { data } = await api.post(`/api/v1/dispatch-notes/${id}/execute`)
  return data.data ?? data
}
