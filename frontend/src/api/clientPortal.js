import api from './client'

export async function fetchClientProjects() {
  const { data } = await api.get('/api/v1/client-portal/projects')
  return data.data ?? data
}

export async function fetchProjectMilestones(projectId) {
  const { data } = await api.get(`/api/v1/client-portal/projects/${projectId}/milestones`)
  return data.data ?? data
}

export async function fetchProjectMedia(projectId) {
  const { data } = await api.get(`/api/v1/client-portal/projects/${projectId}/media`)
  return data.data ?? data
}

export async function fetchProjectComments(projectId) {
  const { data } = await api.get(`/api/v1/client-portal/projects/${projectId}/comments`)
  return data.data ?? data
}

export async function postProjectComment(projectId, content) {
  const { data } = await api.post(`/api/v1/client-portal/projects/${projectId}/comments`, {
    content,
  })
  return data.data ?? data
}

export async function fetchProjectContract(projectId) {
  const { data } = await api.get(`/api/v1/client-portal/projects/${projectId}/contract`)
  return data.data ?? data
}

export async function signProjectContract(projectId, signatureData) {
  const { data } = await api.post(`/api/v1/client-portal/projects/${projectId}/contract/sign`, {
    signature_data: signatureData,
  })
  return data.data ?? data
}
