import api from './client'

export async function fetchClientQuotes() {
  const { data } = await api.get('/api/v1/client-portal/quotes')
  return data.data ?? data
}

export async function fetchClientQuote(quoteId) {
  const { data } = await api.get(`/api/v1/client-portal/quotes/${quoteId}`)
  return data.data ?? data
}

export async function fetchClientQuotePreview(quoteId) {
  const { data } = await api.get(`/api/v1/client-portal/quotes/${quoteId}/preview`)
  return data
}

export async function acceptClientQuote(quoteId, signatureData) {
  const { data } = await api.post(`/api/v1/client-portal/quotes/${quoteId}/accept`, {
    signature_data: signatureData,
  })
  return data.data ?? data
}
