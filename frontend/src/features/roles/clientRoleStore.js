const STORAGE_KEY = 'btp-client-role-assignments'

/** @returns {Record<string, string>} */
export function readClientRoleMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** @param {Record<string, string>} map */
export function writeClientRoleMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getClientRoleId(clientId, fallback = 'client_extern') {
  const map = readClientRoleMap()
  return map[String(clientId)] ?? fallback
}

export function setClientRoleId(clientId, roleId) {
  const map = readClientRoleMap()
  map[String(clientId)] = roleId
  writeClientRoleMap(map)
}
