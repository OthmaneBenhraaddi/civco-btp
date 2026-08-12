import api from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function fetchDashboardSummary() {
  if (isUiOnlyMode()) return stubs.fetchDashboardSummary()
  const { data } = await api.get('/api/v1/dashboard/summary')
  return data
}
