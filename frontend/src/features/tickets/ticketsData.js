/** Ticket UI helpers — data comes from the API. */

export const TICKET_FILTERS = [
  { id: 'all', labelKey: 'tickets.filters.all' },
  { id: 'pending', labelKey: 'tickets.filters.pending' },
  { id: 'waiting', labelKey: 'tickets.filters.waiting' },
  { id: 'resolved', labelKey: 'tickets.filters.resolved' },
]

export const TICKET_PRIORITIES = [
  { id: 'low', labelKey: 'tickets.priorities.low' },
  { id: 'medium', labelKey: 'tickets.priorities.medium' },
  { id: 'high', labelKey: 'tickets.priorities.high' },
]

export const TICKET_CATEGORIES = [
  'Avenants',
  'Opérations chantier',
  'Facturation',
  'Logistique',
  'Contrôle d’accès',
  'Retours & suggestions',
  'Documents',
  'Autre',
]

/** Resolve list filter id → API status for the current audience. */
export function statusParamForFilter(filterId, isClientPortalUser) {
  if (filterId === 'all' || !filterId) return undefined
  if (filterId === 'resolved') return 'resolved'
  if (filterId === 'pending') {
    return isClientPortalUser ? 'awaiting_client' : 'awaiting_staff'
  }
  if (filterId === 'waiting') {
    return isClientPortalUser ? 'awaiting_staff' : 'awaiting_client'
  }
  return filterId
}

export function isPendingForMe(status, isClientPortalUser) {
  if (isClientPortalUser) return status === 'awaiting_client'
  return status === 'awaiting_staff'
}

export function statusLabel(status, t, { isClientPortalUser = false } = {}) {
  if (status === 'resolved') return t('tickets.status.resolved')
  if (status === 'open') return t('tickets.status.open')

  if (status === 'awaiting_client' || status === 'awaiting_staff') {
    return isPendingForMe(status, isClientPortalUser)
      ? t('tickets.status.pending')
      : t('tickets.status.waiting')
  }

  if (status === 'awaiting') return t('tickets.status.waiting')
  return status
}

export function statusClassName(status, isClientPortalUser = false) {
  if (status === 'resolved') return 'is-resolved'
  if (status === 'open') return 'is-open'
  if (status === 'awaiting_client' || status === 'awaiting_staff' || status === 'awaiting') {
    return isPendingForMe(status, isClientPortalUser) ? 'is-pending' : 'is-waiting'
  }
  return ''
}

/** After I reply, the other party owes the next answer. */
export function nextStatusAfterReply(isClientPortalUser) {
  return isClientPortalUser ? 'awaiting_staff' : 'awaiting_client'
}

export function priorityLabel(priority, t) {
  if (priority === 'low') return t('tickets.priorities.low')
  if (priority === 'high') return t('tickets.priorities.high')
  return t('tickets.priorities.medium')
}

export function mapTicketListItem(ticket) {
  return {
    id: String(ticket.id),
    title: ticket.title,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    projectId: ticket.project_id != null ? String(ticket.project_id) : null,
    project: ticket.project?.title ?? ticket.project?.reference ?? null,
    client: ticket.client?.name ?? '—',
    clientId: ticket.client_id != null ? String(ticket.client_id) : null,
    when: ticket.updated_at || ticket.created_at,
    closedAt: ticket.closed_at,
  }
}

export function ticketMetaLine(ticket) {
  const projectOrClient = ticket.project || ticket.client || '—'
  return projectOrClient
}

export function mapTicketMessage(message, t) {
  const isClient = Boolean(message.sender?.is_client)
  return {
    id: String(message.id),
    author: message.sender?.full_name || t('tickets.clientFallback'),
    role: isClient ? t('tickets.roles.client') : t('tickets.roles.staff'),
    initials: message.sender?.initials || 'U',
    when: message.created_at,
    body: message.body,
  }
}
