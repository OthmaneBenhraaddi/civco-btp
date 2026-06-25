import api from './client'

export async function fetchQuotes(params = {}) {
  const { data } = await api.get('/api/v1/quotes', { params })
  return data
}

export async function fetchQuote(id) {
  const { data } = await api.get(`/api/v1/quotes/${id}`)
  return data
}

export async function createQuote(payload) {
  const { data } = await api.post('/api/v1/quotes', payload)
  return data
}

export async function updateQuote(id, payload) {
  const { data } = await api.put(`/api/v1/quotes/${id}`, payload)
  return data
}

export async function deleteQuote(id) {
  const { data } = await api.delete(`/api/v1/quotes/${id}`)
  return data
}

export async function convertQuoteToInvoice(id) {
  const { data } = await api.post(`/api/v1/quotes/${id}/convert-to-invoice`)
  return data
}

export async function incrementQuotePrint(id) {
  const { data } = await api.post(`/api/v1/quotes/${id}/increment-print`)
  return data
}

export async function addQuoteLine(quoteId, payload) {
  const { data } = await api.post(`/api/v1/quotes/${quoteId}/lines`, payload)
  return data
}

export async function updateQuoteLine(lineId, payload) {
  const { data } = await api.put(`/api/v1/quote-lines/${lineId}`, payload)
  return data
}

export async function deleteQuoteLine(lineId) {
  const { data } = await api.delete(`/api/v1/quote-lines/${lineId}`)
  return data
}
