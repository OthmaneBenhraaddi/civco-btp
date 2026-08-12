import api from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function fetchQuotes(params = {}) {
  if (isUiOnlyMode()) return stubs.fetchQuotes(params)
  const { data } = await api.get('/api/v1/quotes', { params })
  return data
}

export async function fetchQuote(id) {
  if (isUiOnlyMode()) return stubs.fetchQuote(id)
  const { data } = await api.get(`/api/v1/quotes/${id}`)
  return data
}

export async function createQuote(payload) {
  if (isUiOnlyMode()) return stubs.createQuote(payload)
  const { data } = await api.post('/api/v1/quotes', payload)
  return data
}

export async function updateQuote(id, payload) {
  if (isUiOnlyMode()) return stubs.updateQuote(id, payload)
  const { data } = await api.put(`/api/v1/quotes/${id}`, payload)
  return data
}

export async function deleteQuote(id) {
  if (isUiOnlyMode()) return stubs.deleteQuote(id)
  const { data } = await api.delete(`/api/v1/quotes/${id}`)
  return data
}

export async function convertQuoteToInvoice(id) {
  if (isUiOnlyMode()) return stubs.convertQuoteToInvoice(id)
  const { data } = await api.post(`/api/v1/quotes/${id}/convert-to-invoice`)
  return data
}

export async function addQuoteLine(quoteId, payload) {
  if (isUiOnlyMode()) return stubs.addQuoteLine(quoteId, payload)
  const { data } = await api.post(`/api/v1/quotes/${quoteId}/lines`, payload)
  return data
}

export async function updateQuoteLine(lineId, payload) {
  if (isUiOnlyMode()) return stubs.updateQuoteLine(lineId, payload)
  const { data } = await api.put(`/api/v1/quote-lines/${lineId}`, payload)
  return data
}

export async function deleteQuoteLine(lineId) {
  if (isUiOnlyMode()) return stubs.deleteQuoteLine(lineId)
  const { data } = await api.delete(`/api/v1/quote-lines/${lineId}`)
  return data
}
