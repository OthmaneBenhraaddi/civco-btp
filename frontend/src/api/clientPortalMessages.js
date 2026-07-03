import api from './client'

export async function fetchMessageThreads() {
  const { data } = await api.get('/api/v1/client-portal/messages/threads')
  return data.data ?? data
}

export async function fetchMessageThread(projectId = null) {
  const params = {}

  if (projectId != null) {
    params.project_id = projectId
  }

  const { data } = await api.get('/api/v1/client-portal/messages/thread', { params })
  return data.data ?? data
}

export async function sendPortalMessage(messageText, projectId = null) {
  const payload = { message_text: messageText }

  if (projectId != null) {
    payload.project_id = projectId
  }

  const { data } = await api.post('/api/v1/client-portal/messages', payload)
  return data.data ?? data
}

export async function updatePortalMessagingPresence({ projectId = null } = {}) {
  const payload = {}

  if (projectId != null) {
    payload.project_id = projectId
  }

  await api.put('/api/v1/messaging/presence', payload)
}

export async function clearPortalMessagingPresence() {
  await api.put('/api/v1/messaging/presence', { active: false })
}
