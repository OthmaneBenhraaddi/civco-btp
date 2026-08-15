import { useEffect, useState } from 'react'
import { formatDemoRemaining, getDemoExpiresAt } from '../utils/demoSession'

export default function useDemoCountdown(user, demo) {
  const expiresAt = getDemoExpiresAt(user, demo)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!expiresAt) return undefined

    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [expiresAt])

  if (!expiresAt) {
    return { remainingMs: null, expired: false, label: null }
  }

  const end = new Date(expiresAt).getTime()
  const remainingMs = Number.isNaN(end) ? 0 : end - now
  const expired = remainingMs <= 0

  return {
    remainingMs: Math.max(0, remainingMs),
    expired,
    label: formatDemoRemaining(remainingMs),
  }
}
