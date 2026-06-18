export function buildAvatarUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1`
}

export function formatLastUpdatedAt(date, locale = 'fr') {
  const value = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}

export function createTaskId() {
  return `tsk-${Date.now()}`
}
