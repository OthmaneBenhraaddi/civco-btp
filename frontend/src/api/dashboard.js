import api from './client'

export async function fetchDashboardSummary() {
  const { data } = await api.get('/api/v1/dashboard/summary')
  return data
}
