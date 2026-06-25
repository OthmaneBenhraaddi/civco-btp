import api from './client'

export async function fetchThemeColors() {
  const { data } = await api.get('/api/v1/theme-colors')
  return data.colors ?? {}
}

export async function updateThemeColors(colors) {
  const { data } = await api.put('/api/v1/theme-colors', { colors })
  return data.colors ?? {}
}
