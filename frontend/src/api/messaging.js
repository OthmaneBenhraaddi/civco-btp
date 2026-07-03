import api from './client'

export async function fetchMessagingThreads() {
  const { data } = await api.get('/api/v1/messaging/threads')
  return data.data ?? data
}

export async function fetchMessagingThread(clientUserId, projectId = null) {
  const params = {}

  if (projectId != null) {
    params.project_id = projectId
  }

  const { data } = await api.get(`/api/v1/messaging/conversations/${clientUserId}`, { params })
  return data.data ?? data
}

export async function sendMessagingMessage(clientUserId, messageText, projectId = null) {
  const payload = {
    receiver_id: clientUserId,
    message_text: messageText,
  }

  if (projectId != null) {
    payload.project_id = projectId
  }

  const { data } = await api.post('/api/v1/messaging/messages', payload)
  return data.data ?? data
}

export async function updateMessagingPresence({ projectId = null, clientUserId = null } = {}) {
  const payload = {}

  if (projectId != null) {
    payload.project_id = projectId
  }

  if (clientUserId != null) {
    payload.client_user_id = clientUserId
  }

  await api.put('/api/v1/messaging/presence', payload)
}

export async function clearMessagingPresence() {
  await api.put('/api/v1/messaging/presence', { active: false })
}
