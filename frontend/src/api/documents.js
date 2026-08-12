import api from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function fetchProjectDocuments(projectId, params = {}) {
  if (isUiOnlyMode()) return stubs.fetchProjectDocuments(projectId, params)
  const { data } = await api.get(`/api/v1/projects/${projectId}/documents`, { params })
  return data
}

export async function uploadProjectDocument(projectId, formData) {
  if (isUiOnlyMode()) {
    const name = formData instanceof FormData ? formData.get('file')?.name : undefined
    return stubs.uploadDocument(projectId, { name })
  }
  const { data } = await api.post(`/api/v1/projects/${projectId}/documents`, formData)
  return data
}

export async function downloadDocument(documentId, filename) {
  if (isUiOnlyMode()) {
    // No binary in UI-only mode — keep the click path quiet for design work.
    console.info(`[UI-only] download skipped for document #${documentId} (${filename})`)
    return
  }

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
  if (isUiOnlyMode()) return stubs.archiveDocument(documentId)
  const { data } = await api.put(`/api/v1/documents/${documentId}/archive`)
  return data
}
