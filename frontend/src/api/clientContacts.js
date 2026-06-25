import api from './client'

export async function createClientContact(clientId, payload) {
  const { data } = await api.post(`/api/v1/clients/${clientId}/contacts`, payload)
  return data
}

export async function updateClientContact(contactId, payload) {
  const { data } = await api.put(`/api/v1/client-contacts/${contactId}`, payload)
  return data
}

export async function deleteClientContact(contactId) {
  const { data } = await api.delete(`/api/v1/client-contacts/${contactId}`)
  return data
}

export const CONTACT_ROLE_OPTIONS = [
  'commercial',
  'comptable',
  'chef_de_projet',
  'technique',
  'direction',
  'autre',
]

export const CONTACT_ROLE_TONES = {
  commercial: 'sky',
  comptable: 'amber',
  chef_de_projet: 'purple',
  technique: 'emerald',
  direction: 'purple',
  autre: 'slate',
}
