import api from './client'

export async function fetchActivityLogs(params = {}) {
  const { data } = await api.get('/api/v1/activity-logs', { params })
  return {
    items: data.data ?? [],
    meta: data.meta ?? {},
    links: data.links ?? {},
  }
}
