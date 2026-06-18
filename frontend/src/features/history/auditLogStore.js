const STORAGE_KEY = 'btp-audit-logs'
const STORAGE_VERSION_KEY = 'btp-audit-logs-version'
const CURRENT_VERSION = '1'
export const AUDIT_LOG_EVENT = 'btp-audit-log-updated'
export const TOAST_EVENT = 'btp-action-toast'

/** @typedef {'creation' | 'modification' | 'suppression'} AuditAction */

/**
 * @typedef {Object} AuditLogEntry
 * @property {string} id
 * @property {AuditAction} action
 * @property {string} actor
 * @property {string} message
 * @property {string} timestamp
 */

/** @type {AuditLogEntry[]} */
export const SEED_AUDIT_LOGS = [
  {
    id: 'log-seed-001',
    action: 'creation',
    actor: 'Admin / Gérant BTP',
    message: 'A créé un nouveau projet VRD: Construction d\'une route de liaison (Commune de Médiouna)',
    timestamp: '2026-06-17T14:24:00.000Z',
  },
  {
    id: 'log-seed-002',
    action: 'creation',
    actor: 'Secrétaire',
    message: 'A généré une facture pour le client Commune de Médiouna (Montant: 450.000 MAD)',
    timestamp: '2026-06-17T11:05:00.000Z',
  },
  {
    id: 'log-seed-003',
    action: 'modification',
    actor: 'Ingénieur',
    message: 'A mis à jour l\'avancement technique du projet R+4 à \'8 MOIS DE SUIVI\'',
    timestamp: '2026-06-17T09:30:00.000Z',
  },
]

function notifyListeners(record) {
  window.dispatchEvent(new CustomEvent(AUDIT_LOG_EVENT))
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: record }))
}

function createLogId() {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** @returns {AuditLogEntry[]} */
export function readAuditLogs() {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      writeAuditLogs(SEED_AUDIT_LOGS)
      return [...SEED_AUDIT_LOGS]
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      writeAuditLogs(SEED_AUDIT_LOGS)
      return [...SEED_AUDIT_LOGS]
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      writeAuditLogs(SEED_AUDIT_LOGS)
      return [...SEED_AUDIT_LOGS]
    }

    return parsed
  } catch {
    writeAuditLogs(SEED_AUDIT_LOGS)
    return [...SEED_AUDIT_LOGS]
  }
}

/** @param {AuditLogEntry[]} logs */
export function writeAuditLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION)
}

/**
 * @param {Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }} entry
 * @returns {AuditLogEntry}
 */
export function appendAuditLog(entry) {
  const logs = readAuditLogs()
  const record = {
    id: createLogId(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    action: entry.action,
    actor: entry.actor,
    message: entry.message,
  }

  logs.unshift(record)
  writeAuditLogs(logs.slice(0, 200))
  notifyListeners(record)
  return record
}

export function formatAuditTime(timestamp, locale = 'fr') {
  const date = new Date(timestamp)
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function actionBadgeLabel(action, t) {
  if (action === 'creation') return t('history.actions.creation')
  if (action === 'modification') return t('history.actions.modification')
  return t('history.actions.suppression')
}

export const ACTION_DOT_CLASS = {
  creation: 'bg-emerald-500 ring-emerald-500/30',
  modification: 'bg-amber-400 ring-amber-400/30',
  suppression: 'bg-red-500 ring-red-500/30',
}

export const ACTION_BADGE_CLASS = {
  creation: 'text-emerald-400 bg-emerald-500/10',
  modification: 'text-amber-400 bg-amber-500/10',
  suppression: 'text-red-400 bg-red-500/10',
}

export const ACTION_TOAST_CLASS = {
  creation: {
    container: 'border-emerald-500/30 bg-[#1f2937]/95',
    icon: 'text-emerald-400',
    title: 'text-emerald-300',
  },
  modification: {
    container: 'border-amber-500/30 bg-[#1f2937]/95',
    icon: 'text-amber-400',
    title: 'text-amber-300',
  },
  suppression: {
    container: 'border-red-500/30 bg-[#1f2937]/95',
    icon: 'text-red-400',
    title: 'text-red-300',
  },
}
