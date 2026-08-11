import api from './client'

export async function fetchProjectAmendments(projectId) {
  const { data } = await api.get(`/api/v1/projects/${projectId}/amendments`)
  return data
}

export async function createAmendment(projectId, formData) {
  const { data } = await api.post(`/api/v1/projects/${projectId}/amendments`, formData)
  return data
}

/** Supports optional file upload via method spoofing (multipart PUT). */
export async function updateAmendment(amendmentId, formData) {
  formData.append('_method', 'PUT')
  const { data } = await api.post(`/api/v1/amendments/${amendmentId}`, formData)
  return data
}

export async function updateAmendmentStatus(amendmentId, status) {
  const { data } = await api.patch(`/api/v1/amendments/${amendmentId}/status`, { status })
  return data
}

export async function deleteAmendment(amendmentId) {
  const { data } = await api.delete(`/api/v1/amendments/${amendmentId}`)
  return data
}

export async function downloadAmendment(amendmentId, filename = 'avenant.pdf') {
  const response = await api.get(`/api/v1/amendments/${amendmentId}/download`, {
    responseType: 'blob',
  })

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = blobUrl
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
