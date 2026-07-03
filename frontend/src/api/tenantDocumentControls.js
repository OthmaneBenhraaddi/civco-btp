import api from './client'

export async function fetchDocumentControls() {
  const { data } = await api.get('/api/v1/tenant/document-controls')
  return data
}

export async function updateDocumentControls(payload) {
  const { data } = await api.put('/api/v1/tenant/document-controls', payload)
  return data
}
