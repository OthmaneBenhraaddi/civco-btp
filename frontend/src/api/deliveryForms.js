import api from './client'

export async function fetchDeliveryForms(params = {}) {
  const { data } = await api.get('/api/v1/delivery-forms', { params })
  return data
}

export async function fetchDeliveryForm(id) {
  const { data } = await api.get(`/api/v1/delivery-forms/${id}`)
  return data
}

export async function createDeliveryForm(payload) {
  const { data } = await api.post('/api/v1/delivery-forms', payload)
  return data
}

export async function updateDeliveryForm(id, payload) {
  const { data } = await api.put(`/api/v1/delivery-forms/${id}`, payload)
  return data
}

export async function deleteDeliveryForm(id) {
  const { data } = await api.delete(`/api/v1/delivery-forms/${id}`)
  return data
}

export async function convertQuoteToDeliveryForm(quoteId, payload = {}) {
  const { data } = await api.post(`/api/v1/quotes/${quoteId}/convert-to-delivery-form`, payload)
  return data
}
