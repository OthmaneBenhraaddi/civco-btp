import api from './client'

export async function fetchTeamTenantOptions() {
  const { data } = await api.get('/api/v1/team/tenant-options')
  return data
}

export async function fetchTeamMembers(params = {}) {
  const { data } = await api.get('/api/v1/team/members', { params })
  return data
}

export async function createTeamMember(payload) {
  const { data } = await api.post('/api/v1/team/members', payload)
  return data
}

export async function toggleTeamMemberStatus(userId) {
  const { data } = await api.patch(`/api/v1/team/members/${userId}/status`)
  return data
}
