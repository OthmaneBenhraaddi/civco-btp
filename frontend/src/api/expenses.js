import api from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function fetchProjectExpenses(projectId) {
  if (isUiOnlyMode()) return stubs.fetchProjectExpenses(projectId)
  const { data } = await api.get(`/api/v1/projects/${projectId}/expenses`)
  return data
}

export async function createExpense(projectId, payload) {
  if (isUiOnlyMode()) return stubs.createExpense(projectId, payload)
  const { data } = await api.post(`/api/v1/projects/${projectId}/expenses`, payload)
  return data
}

export async function updateExpense(expenseId, payload) {
  if (isUiOnlyMode()) return stubs.updateExpense(expenseId, payload)
  const { data } = await api.put(`/api/v1/expenses/${expenseId}`, payload)
  return data
}

export async function deleteExpense(expenseId) {
  if (isUiOnlyMode()) return stubs.deleteExpense(expenseId)
  const { data } = await api.delete(`/api/v1/expenses/${expenseId}`)
  return data
}
