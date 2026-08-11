import api from './client'

export async function fetchClients(params = {}) {
  const { data } = await api.get('/api/v1/clients', { params })
  return data
}

/** Clients available in create forms (projects, quotes, invoices, BL). */
export async function fetchClientsForPicker() {
  return fetchClients({ per_page: 100, exclude_archived: 1, is_active: 1, for_picker: 1 })
}

export async function createClient(payload) {
  const { data } = await api.post('/api/v1/clients', payload)
  return data
}

export async function updateClient(id, payload) {
  const { data } = await api.put(`/api/v1/clients/${id}`, payload)
  return data
}

export async function deleteClient(id) {
  const { data } = await api.delete(`/api/v1/clients/${id}`)
  return data
}

export async function archiveClient(id) {
  const { data } = await api.patch(`/api/v1/clients/${id}/archive`)
  return data
}

export async function fetchClient(id) {
  const { data } = await api.get(`/api/v1/clients/${id}`)
  return data
}

export async function toggleClientPortalStatus(id, active) {
  const { data } = await api.patch(`/api/v1/clients/${id}/portal-status`, { active })
  return data
}
