import api from './client'
import { unwrapResource } from '../utils/apiHelpers'

export async function fetchWorkspaceTasks(params = {}) {
  const { data } = await api.get('/api/v1/workspace-tasks', { params })
  return unwrapResource(data)
}

export async function createWorkspaceTask(payload) {
  const { data } = await api.post('/api/v1/workspace-tasks', payload)
  return data.data ?? data
}

export async function updateWorkspaceTask(id, payload) {
  const { data } = await api.put(`/api/v1/workspace-tasks/${id}`, payload)
  return data.data ?? data
}

export async function deleteWorkspaceTask(id) {
  const { data } = await api.delete(`/api/v1/workspace-tasks/${id}`)
  return data
}
