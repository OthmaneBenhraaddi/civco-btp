export function unwrapResource(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (value && Array.isArray(value.data)) {
    return value.data
  }

  return []
}

export function extractErrorMessage(error, fallback) {
  const data = error?.response?.data

  if (data?.message) {
    return data.message
  }

  if (data?.errors) {
    const first = Object.values(data.errors).flat()[0]
    if (first) {
      return first
    }
  }

  if (error?.response?.status === 419) {
    return 'Session expired. Please refresh the page and try again.'
  }

  if (error?.response?.status === 403) {
    return 'You do not have permission for this action.'
  }

  return fallback
}
