const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

export function formatRelativeTime(isoDate) {
  if (!isoDate) {
    return ''
  }

  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffMs = Date.now() - date.getTime()

  if (diffMs < MINUTE_MS) {
    return 'À l\'instant'
  }

  const minutes = Math.floor(diffMs / MINUTE_MS)
  if (minutes < 60) {
    return `Il y a ${minutes} min`
  }

  const hours = Math.floor(diffMs / HOUR_MS)
  if (hours < 24) {
    return `Il y a ${hours} h`
  }

  const days = Math.floor(diffMs / DAY_MS)
  if (days === 1) {
    return 'Hier'
  }

  if (days < 7) {
    return `Il y a ${days} j`
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}
