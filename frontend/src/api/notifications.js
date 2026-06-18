import api from './client'

export async function fetchUnreadNotifications() {
  const { data } = await api.get('/api/v1/notifications')
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
