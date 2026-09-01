import api from './client'

export async function fetchHomepageContent() {
  const { data } = await api.get('/api/v1/homepage')
  return data
}

export async function fetchHomepageCms() {
  const { data } = await api.get('/api/v1/super-admin/homepage')
  return data
}

export async function updateHomepageCopy(payload) {
  const { data } = await api.put('/api/v1/super-admin/homepage', payload)
  return data
}

export async function uploadHeroBackground(file) {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post('/api/v1/super-admin/homepage/hero-background', formData)
  return data
}

export async function deleteHeroBackground() {
  const { data } = await api.delete('/api/v1/super-admin/homepage/hero-background')
  return data
}

export async function uploadPartnerLogo({ name, logo }) {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('logo', logo)
  const { data } = await api.post('/api/v1/super-admin/homepage/partners', formData)
  return data
}

export async function deletePartnerLogo(id) {
  const { data } = await api.delete(`/api/v1/super-admin/homepage/partners/${id}`)
  return data
}

export async function uploadCardImage(cardId, file) {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post(`/api/v1/super-admin/homepage/cards/${cardId}/image`, formData)
  return data
}

export async function deleteCardImage(cardId) {
  const { data } = await api.delete(`/api/v1/super-admin/homepage/cards/${cardId}/image`)
  return data
}
