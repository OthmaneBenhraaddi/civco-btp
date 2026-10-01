/**
 * Stealth / Mode Furtif — client-side visibility helpers for instant UI updates.
 * Backend scopes remain the source of truth on fresh fetches; these avoid spinner flashes.
 *
 * Confidential records are stored as is_official = false.
 */

export function isOfficialClient(client) {
  if (!client || typeof client !== 'object') {
    return true
  }

  if (typeof client.is_official === 'boolean') {
    return client.is_official
  }

  return true
}

/**
 * Confidential clients stay visible when they own at least one public project.
 */
export function isClientVisibleInStealth(client) {
  if (isOfficialClient(client)) {
    return true
  }

  const publicCount = client?.public_projects_count

  if (typeof publicCount === 'number') {
    return publicCount > 0
  }

  return false
}

export function isProjectVisibleInStealth(project) {
  if (!project || typeof project !== 'object') {
    return true
  }

  if (typeof project.is_official === 'boolean') {
    return project.is_official
  }

  return true
}

export function isOfficialLinkedRecord(record) {
  if (!record || typeof record !== 'object') {
    return true
  }

  if (typeof record.is_official === 'boolean' && !record.client && record.client_is_official == null) {
    return record.is_official
  }

  if (record.client) {
    return isOfficialClient(record.client)
  }

  if (typeof record.client_is_official === 'boolean') {
    return record.client_is_official
  }

  if (typeof record.is_official === 'boolean') {
    return record.is_official
  }

  return true
}

export function filterOfficialClients(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.filter(isClientVisibleInStealth)
}

export function filterOfficialProjects(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.filter(isProjectVisibleInStealth)
}

export function filterOfficialLinkedRecords(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.filter(isOfficialLinkedRecord)
}
