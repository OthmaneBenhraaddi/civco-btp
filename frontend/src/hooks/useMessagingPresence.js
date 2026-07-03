import { useEffect } from 'react'
import * as clientPortalMessagesApi from '../api/clientPortalMessages'
import * as messagingApi from '../api/messaging'

const PRESENCE_INTERVAL_MS = 20000

async function clearPresence(isClientPortal) {
  if (isClientPortal) {
    await clientPortalMessagesApi.clearPortalMessagingPresence()
    return
  }

  await messagingApi.clearMessagingPresence()
}

async function sendPresence({ isClientPortal, projectId, clientUserId }) {
  if (isClientPortal) {
    await clientPortalMessagesApi.updatePortalMessagingPresence({ projectId })
    return
  }

  await messagingApi.updateMessagingPresence({ projectId, clientUserId })
}

export function useMessagingPresence({
  enabled = true,
  projectId = null,
  clientUserId = null,
  isClientPortal = false,
}) {
  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    let cancelled = false

    const ping = async () => {
      if (cancelled || document.visibilityState === 'hidden') {
        return
      }

      try {
        await sendPresence({ isClientPortal, projectId, clientUserId })
      } catch {
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearPresence(isClientPortal).catch(() => {})
        return
      }

      ping()
    }

    ping()
    const intervalId = window.setInterval(ping, PRESENCE_INTERVAL_MS)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearPresence(isClientPortal).catch(() => {})
    }
  }, [enabled, projectId, clientUserId, isClientPortal])
}
