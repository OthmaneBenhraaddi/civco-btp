import api from './client'

export async function fetchQuoteDocumentPreview(quoteId) {
  const { data } = await api.get(`/api/v1/quotes/${quoteId}/document-preview`)
  return data
}

export async function fetchInvoiceDocumentPreview(invoiceId) {
  const { data } = await api.get(`/api/v1/invoices/${invoiceId}/document-preview`)
  return data
}

export async function fetchDeliveryFormDocumentPreview(deliveryFormId) {
  const { data } = await api.get(`/api/v1/delivery-forms/${deliveryFormId}/document-preview`)
  return data
}
