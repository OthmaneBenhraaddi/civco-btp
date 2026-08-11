/**
 * Stealth / Mode Furtif — client-side visibility helpers for instant UI updates.
 * Backend scopes remain the source of truth on fresh fetches; these avoid spinner flashes.
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

export function isOfficialLinkedRecord(record) {
  if (!record || typeof record !== 'object') {
    return true
  }

  if (typeof record.is_official === 'boolean') {
    return record.is_official
  }

  if (record.client) {
    return isOfficialClient(record.client)
  }

  if (typeof record.client_is_official === 'boolean') {
    return record.client_is_official
  }

  return true
}

export function filterOfficialClients(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.filter(isOfficialClient)
}

export function filterOfficialLinkedRecords(items) {
  if (!Array.isArray(items)) {
    return []
  }

  return items.filter(isOfficialLinkedRecord)
}
