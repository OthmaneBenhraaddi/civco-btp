import api from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function fetchInvoices(params = {}) {
  if (isUiOnlyMode()) return stubs.fetchInvoices(params)
  const { data } = await api.get('/api/v1/invoices', { params })
  return data
}

export async function fetchInvoice(id) {
  if (isUiOnlyMode()) return stubs.fetchInvoice(id)
  const { data } = await api.get(`/api/v1/invoices/${id}`)
  return data
}

export async function createInvoice(payload) {
  if (isUiOnlyMode()) return stubs.createInvoice(payload)
  const { data } = await api.post('/api/v1/invoices', payload)
  return data
}

export async function updateInvoice(id, payload) {
  if (isUiOnlyMode()) return stubs.updateInvoice(id, payload)
  const { data } = await api.put(`/api/v1/invoices/${id}`, payload)
  return data
}

export async function deleteInvoice(id) {
  if (isUiOnlyMode()) return stubs.deleteInvoice(id)
  const { data } = await api.delete(`/api/v1/invoices/${id}`)
  return data
}

export async function addInvoiceLine(invoiceId, payload) {
  if (isUiOnlyMode()) return stubs.addInvoiceLine(invoiceId, payload)
  const { data } = await api.post(`/api/v1/invoices/${invoiceId}/lines`, payload)
  return data
}

export async function updateInvoiceLine(lineId, payload) {
  if (isUiOnlyMode()) return stubs.updateInvoiceLine(lineId, payload)
  const { data } = await api.put(`/api/v1/invoice-lines/${lineId}`, payload)
  return data
}

export async function deleteInvoiceLine(lineId) {
  if (isUiOnlyMode()) return stubs.deleteInvoiceLine(lineId)
  const { data } = await api.delete(`/api/v1/invoice-lines/${lineId}`)
  return data
}

export async function recordPayment(invoiceId, payload) {
  if (isUiOnlyMode()) return stubs.recordPayment(invoiceId, payload)
  const { data } = await api.post(`/api/v1/invoices/${invoiceId}/payments`, payload)
  return data
}

export async function deletePayment(paymentId) {
  if (isUiOnlyMode()) return stubs.deletePayment(paymentId)
  const { data } = await api.delete(`/api/v1/payments/${paymentId}`)
  return data
}
