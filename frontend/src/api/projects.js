import api from './client'

export async function fetchProjects(params = {}) {
  const { data } = await api.get('/api/v1/projects', { params })
  return data
}

export async function fetchMapProjects() {
  const { data } = await api.get('/api/v1/projects', { params: { map: 1 } })
  return data
}

export async function fetchProject(id) {
  const { data } = await api.get(`/api/v1/projects/${id}`)
  return data
}

export async function createProject(payload) {
  const { data } = await api.post('/api/v1/projects', payload)
  return data
}

export async function updateProject(id, payload) {
  const { data } = await api.put(`/api/v1/projects/${id}`, payload)
  return data
}

export async function deleteProject(id) {
  const { data } = await api.delete(`/api/v1/projects/${id}`)
  return data
}

export async function createPhase(projectId, payload) {
  const { data } = await api.post(`/api/v1/projects/${projectId}/phases`, payload)
  return data
}

export async function updatePhase(phaseId, payload) {
  const { data } = await api.put(`/api/v1/phases/${phaseId}`, payload)
  return data
}

export async function deletePhase(phaseId) {
  const { data } = await api.delete(`/api/v1/phases/${phaseId}`)
  return data
}

export async function createTask(phaseId, payload) {
  const { data } = await api.post(`/api/v1/phases/${phaseId}/tasks`, payload)
  return data
}

export async function updateTask(taskId, payload) {
  const { data } = await api.put(`/api/v1/tasks/${taskId}`, payload)
  return data
}

export async function deleteTask(taskId) {
  const { data } = await api.delete(`/api/v1/tasks/${taskId}`)
  return data
}

export async function addTeamMember(projectId, payload) {
  const { data } = await api.post(`/api/v1/projects/${projectId}/team`, payload)
  return data
}

export async function removeTeamMember(projectId, userId) {
  const { data } = await api.delete(`/api/v1/projects/${projectId}/team/${userId}`)
  return data
}

export async function fetchProgressSnapshots(projectId) {
  const { data } = await api.get(`/api/v1/projects/${projectId}/progress`)
  return data
}

export async function createProgressSnapshot(projectId, payload) {
  const { data } = await api.post(`/api/v1/projects/${projectId}/progress`, payload)
  return data
}

export async function fetchCompanyUsers() {
  const { data } = await api.get('/api/v1/company/users')
  return data
}

export async function uploadProjectMedia(projectId, { title, image }) {
  const formData = new FormData()
  formData.append('title', title)
  formData.append('image', image)

  const { data } = await api.post(`/api/v1/projects/${projectId}/media`, formData)
  return data
}
