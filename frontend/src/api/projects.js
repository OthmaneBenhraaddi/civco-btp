import api from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function fetchProjects(params = {}) {
  if (isUiOnlyMode()) return stubs.fetchProjects(params)
  const { data } = await api.get('/api/v1/projects', { params })
  return data
}

export async function fetchProject(id) {
  if (isUiOnlyMode()) return stubs.fetchProject(id)
  const { data } = await api.get(`/api/v1/projects/${id}`)
  return data
}

export async function createProject(payload) {
  if (isUiOnlyMode()) return stubs.createProject(payload)
  const { data } = await api.post('/api/v1/projects', payload)
  return data
}

export async function updateProject(id, payload) {
  if (isUiOnlyMode()) return stubs.updateProject(id, payload)
  const { data } = await api.put(`/api/v1/projects/${id}`, payload)
  return data
}

export async function deleteProject(id) {
  if (isUiOnlyMode()) return stubs.deleteProject(id)
  const { data } = await api.delete(`/api/v1/projects/${id}`)
  return data
}

export async function createPhase(projectId, payload) {
  if (isUiOnlyMode()) return stubs.createPhase(projectId, payload)
  const { data } = await api.post(`/api/v1/projects/${projectId}/phases`, payload)
  return data
}

export async function updatePhase(phaseId, payload) {
  if (isUiOnlyMode()) return stubs.updatePhase(phaseId, payload)
  const { data } = await api.put(`/api/v1/phases/${phaseId}`, payload)
  return data
}

export async function deletePhase(phaseId) {
  if (isUiOnlyMode()) return stubs.deletePhase(phaseId)
  const { data } = await api.delete(`/api/v1/phases/${phaseId}`)
  return data
}

export async function createTask(phaseId, payload) {
  if (isUiOnlyMode()) return stubs.createTask(phaseId, payload)
  const { data } = await api.post(`/api/v1/phases/${phaseId}/tasks`, payload)
  return data
}

export async function updateTask(taskId, payload) {
  if (isUiOnlyMode()) return stubs.updateTask(taskId, payload)
  const { data } = await api.put(`/api/v1/tasks/${taskId}`, payload)
  return data
}

export async function deleteTask(taskId) {
  if (isUiOnlyMode()) return stubs.deleteTask(taskId)
  const { data } = await api.delete(`/api/v1/tasks/${taskId}`)
  return data
}

export async function addTeamMember(projectId, payload) {
  if (isUiOnlyMode()) return stubs.addTeamMember(projectId, payload)
  const { data } = await api.post(`/api/v1/projects/${projectId}/team`, payload)
  return data
}

export async function removeTeamMember(projectId, userId) {
  if (isUiOnlyMode()) return stubs.removeTeamMember(projectId, userId)
  const { data } = await api.delete(`/api/v1/projects/${projectId}/team/${userId}`)
  return data
}

export async function fetchProgressSnapshots(projectId) {
  if (isUiOnlyMode()) return stubs.fetchProgressSnapshots(projectId)
  const { data } = await api.get(`/api/v1/projects/${projectId}/progress`)
  return data
}

export async function createProgressSnapshot(projectId, payload) {
  if (isUiOnlyMode()) return stubs.createProgressSnapshot(projectId, payload)
  const { data } = await api.post(`/api/v1/projects/${projectId}/progress`, payload)
  return data
}

export async function fetchCompanyUsers() {
  if (isUiOnlyMode()) return stubs.fetchCompanyUsers()
  const { data } = await api.get('/api/v1/company/users')
  return data
}
