const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000

export function formatRelativeTime(isoDate, locale = 'fr') {
  if (!isoDate) {
    return ''
  }

  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffMs = Date.now() - date.getTime()
  const isFrench = locale === 'fr'

  if (diffMs < MINUTE_MS) {
    return isFrench ? 'À l\'instant' : 'Just now'
  }

  const minutes = Math.floor(diffMs / MINUTE_MS)
  if (minutes < 60) {
    return isFrench ? `Il y a ${minutes} min` : `${minutes} min ago`
  }

  const hours = Math.floor(diffMs / HOUR_MS)
  if (hours < 24) {
    return isFrench ? `Il y a ${hours} h` : `${hours} h ago`
  }

  const days = Math.floor(diffMs / DAY_MS)
  if (days === 1) {
    return isFrench ? 'Hier' : 'Yesterday'
  }

  if (days < 7) {
    return isFrench ? `Il y a ${days} j` : `${days} d ago`
  }

  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}
