import api from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function fetchClients(params = {}) {
  if (isUiOnlyMode()) return stubs.fetchClients(params)
  const { data } = await api.get('/api/v1/clients', { params })
  return data
}

export async function createClient(payload) {
  if (isUiOnlyMode()) return stubs.createClient(payload)
  const { data } = await api.post('/api/v1/clients', payload)
  return data
}

export async function updateClient(id, payload) {
  if (isUiOnlyMode()) return stubs.updateClient(id, payload)
  const { data } = await api.put(`/api/v1/clients/${id}`, payload)
  return data
}

export async function deleteClient(id) {
  if (isUiOnlyMode()) return stubs.deleteClient(id)
  const { data } = await api.delete(`/api/v1/clients/${id}`)
  return data
}

export async function fetchClient(id) {
  if (isUiOnlyMode()) return stubs.fetchClient(id)
  const { data } = await api.get(`/api/v1/clients/${id}`)
  return data
}
