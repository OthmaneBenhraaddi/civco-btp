import { useCallback } from 'react'
import { useToast } from '../context/ToastContext'

/**
 * Thin wrappers around pushToast for consistent CRUD feedback.
 * Prefer these over coupling new flows to the local audit-log store.
 */
export function useActionToast() {
  const { pushToast, dismissToast } = useToast()

  const toastSuccess = useCallback((message) => {
    pushToast({ action: 'creation', message })
  }, [pushToast])

  const toastUpdated = useCallback((message) => {
    pushToast({ action: 'modification', message })
  }, [pushToast])

  const toastDeleted = useCallback((message) => {
    pushToast({ action: 'suppression', message })
  }, [pushToast])

  const toastError = useCallback((message) => {
    pushToast({ action: 'error', message })
  }, [pushToast])

  const toastFromNotification = useCallback((notification) => {
    const message = [notification?.title, notification?.message]
      .filter(Boolean)
      .join(' — ')

    if (!message) {
      return
    }

    pushToast({
      id: `notif-${notification.id}`,
      action: 'modification',
      message,
    })
  }, [pushToast])

  return {
    toastSuccess,
    toastUpdated,
    toastDeleted,
    toastError,
    toastFromNotification,
    pushToast,
    dismissToast,
  }
}
