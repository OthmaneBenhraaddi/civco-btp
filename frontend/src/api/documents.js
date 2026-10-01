import api from './client'

export async function fetchDocuments(params = {}) {
  const { data } = await api.get('/api/v1/documents', { params })
  return data
}

export async function uploadDocument(formData) {
  const { data } = await api.post('/api/v1/documents', formData)
  return data
}

export async function assignDocumentProject(documentId, projectId) {
  const { data } = await api.put(`/api/v1/documents/${documentId}/project`, { project_id: projectId })
  return data
}

export async function detachDocument(documentId) {
  const { data } = await api.delete(`/api/v1/documents/${documentId}/project`)
  return data
}

export async function deleteDocument(documentId) {
  const { data } = await api.delete(`/api/v1/documents/${documentId}`)
  return data
}

export async function previewDocument(documentId) {
  const response = await api.get(`/api/v1/documents/${documentId}/preview`, {
    responseType: 'blob',
  })
  const type = response.headers['content-type'] || 'application/octet-stream'
  const url = window.URL.createObjectURL(new Blob([response.data], { type }))
  window.open(url, '_blank', 'noopener')
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
}

export async function fetchProjectDocuments(projectId, params = {}) {
  const { data } = await api.get(`/api/v1/projects/${projectId}/documents`, { params })
  return data
}

export async function uploadProjectDocument(projectId, formData) {
  const { data } = await api.post(`/api/v1/projects/${projectId}/documents`, formData)
  return data
}

export async function downloadDocument(documentId, filename) {
  const response = await api.get(`/api/v1/documents/${documentId}/download`, {
    responseType: 'blob',
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = window.document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  window.document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function archiveDocument(documentId) {
  const { data } = await api.put(`/api/v1/documents/${documentId}/archive`)
  return data
}
