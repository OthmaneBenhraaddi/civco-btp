import api from './client'

export async function trackPrint(documentType, documentId, { hasHeader = true } = {}) {
  const { data } = await api.post('/api/v1/prints/track', {
    document_type: documentType,
    document_id: documentId,
    has_header: hasHeader,
  })
  return data
}
