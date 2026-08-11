import api from './client'
import { unwrapResource } from '../utils/apiHelpers'

export async function fetchDocumentTemplates(params = {}) {
  const { data } = await api.get('/api/v1/document-templates', { params })
  return unwrapResource(data)
}

export async function fetchDocumentTemplatePlaceholders() {
  const { data } = await api.get('/api/v1/document-templates/placeholders')
  return data
}

export async function createDocumentTemplate(payload) {
  const { data } = await api.post('/api/v1/document-templates', payload)
  return data
}

export async function updateDocumentTemplate(id, payload) {
  const { data } = await api.put(`/api/v1/document-templates/${id}`, payload)
  return data
}

export async function deleteDocumentTemplate(id) {
  const { data } = await api.delete(`/api/v1/document-templates/${id}`)
  return data
}

export async function previewDocumentTemplate(id, params = {}) {
  const { data } = await api.get(`/api/v1/document-templates/${id}/preview`, { params })
  return data
}
