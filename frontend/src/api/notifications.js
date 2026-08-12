import api from './client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import * as stubs from '../mocks/apiStubs'

export async function fetchUnreadNotifications() {
  if (isUiOnlyMode()) return stubs.fetchUnreadNotifications()

  const { data } = await api.get('/api/v1/notifications')
  return {
    items: data.data ?? [],
    unreadCount: data.meta?.unread_count ?? (data.data?.length ?? 0),
  }
}

export async function markNotificationAsRead(notificationId) {
  if (isUiOnlyMode()) return stubs.markNotificationAsRead(notificationId)

  const { data } = await api.put(`/api/v1/notifications/${notificationId}/read`)
  return {
    item: data.data,
    unreadCount: data.meta?.unread_count ?? 0,
  }
}
