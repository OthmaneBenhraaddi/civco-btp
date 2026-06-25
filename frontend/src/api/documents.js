import api from './client'

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
