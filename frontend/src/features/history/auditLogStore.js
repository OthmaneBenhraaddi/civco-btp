const STORAGE_KEY = 'btp-audit-logs'
const STORAGE_VERSION_KEY = 'btp-audit-logs-version'
const CURRENT_VERSION = '3'
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
    actor: 'Administrateur Système',
    message: 'A créé le projet « Aménagement du Boulevard Panoramique (VRD) ».',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 240).toISOString(),
  },
  {
    id: 'log-seed-002',
    action: 'creation',
    actor: 'Yassine Mansouri',
    message: 'A planifié la réunion de coordination — Société Al Omrane Casablanca.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 'log-seed-003',
    action: 'modification',
    actor: 'Amine Alami',
    message: 'A mis à jour l\'avancement du chantier Villa California — lotissement California.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'log-seed-004',
    action: 'creation',
    actor: 'Administrateur Système',
    message: 'A créé le projet « Promenade & VRD Corniche Malabata — Extension Littorale (VRD) ».',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString(),
  },
  {
    id: 'log-seed-005',
    action: 'modification',
    actor: 'Amine Alami',
    message: 'A validé le coulage dalle RDC — club house Palmeraie Golf, Marrakech.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
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
    container: 'border border-emerald-500/20 bg-slate-900/75 backdrop-blur-md',
    icon: 'text-emerald-400',
    title: 'text-emerald-400',
  },
  modification: {
    container: 'border border-amber-500/20 bg-slate-900/75 backdrop-blur-md',
    icon: 'text-amber-400',
    title: 'text-amber-400',
  },
  suppression: {
    container: 'border border-red-500/20 bg-slate-900/75 backdrop-blur-md',
    icon: 'text-red-400',
    title: 'text-red-400',
  },
}
