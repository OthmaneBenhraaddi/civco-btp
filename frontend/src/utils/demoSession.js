export function isDemoSession(user, demo = null) {
  return Boolean(user?.is_demo || demo?.expires_at)
}

export function getDemoExpiresAt(user, demo = null) {
  return demo?.expires_at || user?.demo_expires_at || null
}

export function formatDemoRemaining(ms) {
  if (ms == null || ms <= 0) {
    return '00h 00m'
  }

  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
}
