const STORAGE_KEY = 'sa-platform-logs'
export const SA_PLATFORM_LOG_EVENT = 'sa-platform-log-updated'

function readStoredLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStoredLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function readPlatformLogs() {
  return readStoredLogs()
}

export function appendPlatformAccessLog(member, nextStatus, actorLabel = 'Super Admin') {
  const memberLabel = member.full_name ?? member.name ?? member.email ?? 'Utilisateur'
  const isDeactivating = nextStatus !== 'active'
  const message = isDeactivating
    ? `🔐 Sécurité — Accès désactivé pour ${memberLabel} par ${actorLabel}.`
    : `🔐 Sécurité — Accès réactivé pour ${memberLabel} par ${actorLabel}.`

  const entry = {
    id: `sa-platform-${Date.now()}-${member.id}`,
    tenant_slug: member.tenant?.subdomain ?? 'system',
    tenant_name: member.tenant?.name ?? 'Plateforme',
    user_id: 'superadmin',
    actor: actorLabel,
    project_id: '',
    project_reference: '',
    project_title: '',
    action: 'modification',
    action_type: 'updated',
    message,
    timestamp: new Date().toISOString(),
  }

  const nextLogs = [entry, ...readStoredLogs()].slice(0, 100)
  writeStoredLogs(nextLogs)
  window.dispatchEvent(new CustomEvent(SA_PLATFORM_LOG_EVENT))

  return entry
}

export function appendCredentialUpdateLog(
  member,
  roleLabel,
  newEmail,
  actorLabel = 'Super Admin',
  { emailChanged = false, passwordChanged = false } = {},
) {
  const memberLabel = member.full_name ?? member.name ?? member.email ?? 'Utilisateur'
  const safeRoleLabel = roleLabel?.trim() ? roleLabel : 'Membre'
  let message
  if (emailChanged && passwordChanged) {
    message = `🔐 Sécurité — ${memberLabel} (${safeRoleLabel}) a mis à jour son e-mail et son mot de passe (Nouvel e-mail: ${newEmail}).`
  } else if (passwordChanged) {
    message = `🔐 Sécurité — ${memberLabel} (${safeRoleLabel}) a mis à jour son mot de passe.`
  } else {
    message = `🔐 Sécurité — ${memberLabel} (${safeRoleLabel}) a mis à jour son e-mail (Nouvel e-mail: ${newEmail}).`
  }

  const entry = {
    id: `sa-credentials-${Date.now()}-${member.id ?? 'self'}`,
    tenant_slug: member.tenant?.subdomain ?? 'system',
    tenant_name: member.tenant?.name ?? 'Plateforme',
    user_id: member.id ? String(member.id) : 'self',
    actor: actorLabel,
    project_id: '',
    project_reference: '',
    project_title: '',
    action: 'modification',
    action_type: 'updated',
    message,
    timestamp: new Date().toISOString(),
  }

  const nextLogs = [entry, ...readStoredLogs()].slice(0, 100)
  writeStoredLogs(nextLogs)
  window.dispatchEvent(new CustomEvent(SA_PLATFORM_LOG_EVENT))

  return entry
}

export function mergeSuperAdminLogs(demoLogs, platformLogs = readPlatformLogs()) {
  return [...platformLogs, ...demoLogs].sort(
    (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
  )
}
