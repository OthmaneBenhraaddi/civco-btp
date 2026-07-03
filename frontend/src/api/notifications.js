import api from './client'

export async function fetchUnreadNotifications({ limit } = {}) {
  const { data } = await api.get('/api/v1/notifications', {
    params: limit ? { limit } : undefined,
  })
  return {
    items: data.data ?? [],
    unreadCount: data.meta?.unread_count ?? (data.data?.length ?? 0),
  }
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await api.put(`/api/v1/notifications/${notificationId}/read`)
  return {
    item: data.data,
    unreadCount: data.meta?.unread_count ?? 0,
  }
}

export async function markAllNotificationsAsRead() {
  const { data } = await api.put('/api/v1/notifications/read-all')
  return {
    unreadCount: data.meta?.unread_count ?? 0,
  }
}
