import {
  ALL_PERMISSION_IDS,
  SYSTEM_ROLES,
  cloneRolePermissions,
} from './mockRoles'

const CUSTOM_ROLES_KEY = 'btp-custom-roles'
const ROLE_PERMISSIONS_KEY = 'btp-role-permissions'

/** @returns {import('./mockRoles.js').SystemRole[]} */
export function readCustomRoles() {
  try {
    const raw = localStorage.getItem(CUSTOM_ROLES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** @param {import('./mockRoles.js').SystemRole[]} roles */
export function writeCustomRoles(roles) {
  localStorage.setItem(CUSTOM_ROLES_KEY, JSON.stringify(roles))
}

/** @returns {Record<string, string[]>} */
export function readRolePermissionsMap() {
  try {
    const raw = localStorage.getItem(ROLE_PERMISSIONS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** @param {Record<string, string[]>} map */
export function writeRolePermissionsMap(map) {
  localStorage.setItem(ROLE_PERMISSIONS_KEY, JSON.stringify(map))
}

export function getAllRoles() {
  return [...SYSTEM_ROLES, ...readCustomRoles()]
}

export function getRoleById(roleId, fallback = 'client_extern') {
  return getAllRoles().find((role) => role.id === roleId)
    ?? SYSTEM_ROLES.find((role) => role.id === fallback)
    ?? SYSTEM_ROLES[0]
}

export function getRoleLabel(role, t) {
  if (!role) {
    return ''
  }

  return role.nameKey ? t(role.nameKey) : role.name ?? ''
}

export function getRoleDescription(role, t) {
  if (!role) {
    return ''
  }

  return role.descriptionKey ? t(role.descriptionKey) : role.description ?? ''
}

export function buildRolePermissionsState() {
  const roles = getAllRoles()
  const base = cloneRolePermissions(roles)
  const stored = readRolePermissionsMap()

  return {
    ...base,
    ...stored,
  }
}

export function persistRolePermissions(map) {
  writeRolePermissionsMap(map)
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || 'role'
}

/**
 * @param {string} name
 * @param {string} description
 */
export function createCustomRole(name, description) {
  const trimmedName = name.trim()
  const id = `custom_${slugify(trimmedName)}_${Date.now()}`

  const role = {
    id,
    name: trimmedName,
    description: description.trim(),
    isCustom: true,
    badgeTone: 'slate',
    permissions: [],
  }

  const customRoles = readCustomRoles()
  customRoles.push(role)
  writeCustomRoles(customRoles)

  const permissionsMap = readRolePermissionsMap()
  permissionsMap[id] = []
  writeRolePermissionsMap(permissionsMap)

  return role
}

export { ALL_PERMISSION_IDS }
