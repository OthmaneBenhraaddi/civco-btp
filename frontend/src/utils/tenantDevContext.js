const STORAGE_KEY = 'civco_dev_tenant_slug'

function normalizeSlug(value) {
  if (!value || typeof value !== 'string') {
    return null
  }

  const slug = value.trim().toLowerCase()

  return slug.length > 0 ? slug : null
}

export function initTenantDevContext() {
  const fromUrl = normalizeSlug(new URLSearchParams(window.location.search).get('tenant'))

  if (fromUrl) {
    sessionStorage.setItem(STORAGE_KEY, fromUrl)
  }
}

export function getDevTenantSlug() {
  const fromUrl = normalizeSlug(new URLSearchParams(window.location.search).get('tenant'))

  if (fromUrl) {
    return fromUrl
  }

  return normalizeSlug(sessionStorage.getItem(STORAGE_KEY))
}

export function setDevTenantSlug(slug) {
  const normalized = normalizeSlug(slug)

  if (normalized) {
    sessionStorage.setItem(STORAGE_KEY, normalized)
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

export function clearDevTenantSlug() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function appendTenantQuery(path) {
  const slug = getDevTenantSlug()

  if (!slug) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'

  return `${path}${separator}tenant=${encodeURIComponent(slug)}`
}
