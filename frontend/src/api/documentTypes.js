import api from './client'

export async function fetchDocumentTypes(params = {}) {
  const { data } = await api.get('/api/v1/document-types', { params })
  return data
}

export async function createDocumentType(payload) {
  const { data } = await api.post('/api/v1/document-types', payload)
  return data
}

export async function updateDocumentType(id, payload) {
  const { data } = await api.put(`/api/v1/document-types/${id}`, payload)
  return data
}

export async function deleteDocumentType(id, { reassignTo } = {}) {
  const { data } = await api.delete(`/api/v1/document-types/${id}`, {
    params: reassignTo ? { reassign_to: reassignTo } : undefined,
  })
  return data
}
