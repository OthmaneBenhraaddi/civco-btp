import api from './client'

export async function fetchInvoices(params = {}) {
  const { data } = await api.get('/api/v1/invoices', { params })
  return data
}

export async function fetchInvoice(id) {
  const { data } = await api.get(`/api/v1/invoices/${id}`)
  return data
}

export async function createInvoice(payload) {
  const { data } = await api.post('/api/v1/invoices', payload)
  return data
}

export async function updateInvoice(id, payload) {
  const { data } = await api.put(`/api/v1/invoices/${id}`, payload)
  return data
}

export async function deleteInvoice(id) {
  const { data } = await api.delete(`/api/v1/invoices/${id}`)
  return data
}

export async function addInvoiceLine(invoiceId, payload) {
  const { data } = await api.post(`/api/v1/invoices/${invoiceId}/lines`, payload)
  return data
}

export async function updateInvoiceLine(lineId, payload) {
  const { data } = await api.put(`/api/v1/invoice-lines/${lineId}`, payload)
  return data
}

export async function deleteInvoiceLine(lineId) {
  const { data } = await api.delete(`/api/v1/invoice-lines/${lineId}`)
  return data
}

export async function recordPayment(invoiceId, payload) {
  const { data } = await api.post(`/api/v1/invoices/${invoiceId}/payments`, payload)
  return data
}

export async function deletePayment(paymentId) {
  const { data } = await api.delete(`/api/v1/payments/${paymentId}`)
  return data
}
