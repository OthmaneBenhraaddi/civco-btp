import api from './client'

export async function fetchProjectExpenses(projectId) {
  const { data } = await api.get(`/api/v1/projects/${projectId}/expenses`)
  return data
}

export async function createExpense(projectId, payload) {
  const { data } = await api.post(`/api/v1/projects/${projectId}/expenses`, payload)
  return data
}

export async function updateExpense(expenseId, payload) {
  const { data } = await api.put(`/api/v1/expenses/${expenseId}`, payload)
  return data
}

export async function deleteExpense(expenseId) {
  const { data } = await api.delete(`/api/v1/expenses/${expenseId}`)
  return data
}
