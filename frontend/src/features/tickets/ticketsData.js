/** Hardcoded ticket conversations between clients and team/admins. */

export const TICKET_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'awaiting', label: 'Awaiting Reply' },
  { id: 'resolved', label: 'Resolved' },
]

export const TICKETS = [
  {
    id: '018a548e',
    title: 'Amendment — Extra concrete pour Lot 2',
    category: 'Amendments',
    when: '2 hours ago',
    status: 'open',
    project: 'Route de liaison Médiouna',
    client: 'Commune de Médiouna',
  },
  {
    id: '018a401b',
    title: 'Client request: revised drainage plan',
    category: 'Feedback & Suggestions',
    when: '1 day ago',
    status: 'awaiting',
    project: 'Immeuble Atlas R+4',
    client: 'Atlas Immobilier',
  },
  {
    id: '0189f22c',
    title: 'Safety checklist delay — échafaudage',
    category: 'Site Operations',
    when: '3 days ago',
    status: 'open',
    project: 'Immeuble Atlas R+4',
    client: 'Atlas Immobilier',
  },
  {
    id: '0188c10a',
    title: 'Custom plates for site vehicles',
    category: 'Logistics',
    when: '9 months ago',
    status: 'resolved',
    project: 'Chantier Marina',
    client: 'Marina Développement',
  },
  {
    id: '0187b55d',
    title: 'Invoice mismatch FAC-2026-008',
    category: 'Billing',
    when: '5 days ago',
    status: 'awaiting',
    project: 'Route de liaison Médiouna',
    client: 'Commune de Médiouna',
  },
  {
    id: '0186a90f',
    title: 'Permission access for new ingénieur',
    category: 'Access Control',
    when: '1 week ago',
    status: 'resolved',
    project: 'Route de liaison Médiouna',
    client: 'Civco Internal',
  },
  {
    id: '0185e12a',
    title: 'Lot boundary update — Commune de Médiouna',
    category: 'Feedback & Suggestions',
    when: '2 weeks ago',
    status: 'resolved',
    project: 'Route de liaison Médiouna',
    client: 'Commune de Médiouna',
  },
]

/** Conversation threads keyed by ticket id */
export const TICKET_THREADS = {
  '018a548e': {
    messages: [
      {
        id: 'm1',
        author: 'Hassan Alaoui',
        role: 'Client',
        initials: 'HA',
        when: '2 hours ago',
        body: [
          { label: 'Issue', text: 'Additional concrete pour required on Lot 2 after soil compaction variance.' },
          { label: 'Site', text: 'Route de liaison Médiouna — Assainissement' },
          { label: 'Requested volume', text: '+48 m³ C25/30' },
          { label: 'Impact', text: 'Schedule shift of approx. 3 working days if not approved this week.' },
          { label: 'Attachment note', text: 'Topo survey PDF shared with the bureau d’études.' },
        ],
      },
      {
        id: 'm2',
        author: 'Nadia Ouarzazi',
        role: 'Chef de chantier',
        initials: 'NO',
        when: '1 hour ago',
        body: [
          { label: 'Update', text: 'On-site confirmation: pour zone marked. Waiting for client amendment signature.' },
          { label: 'Next step', text: 'Please confirm budget line before Thursday 10:00.' },
        ],
      },
    ],
  },
  '018a401b': {
    messages: [
      {
        id: 'm1',
        author: 'Sara Benali',
        role: 'Client',
        initials: 'SB',
        when: '1 day ago',
        body: [
          { label: 'Issue', text: 'Drainage layout on level -1 conflicts with parking ramp clearances.' },
          { label: 'Reproduction steps', text: 'Compare plan A-12 vs latest VRD overlay — clash near grid C4.' },
          { label: 'Project', text: 'Immeuble Atlas R+4' },
          { label: 'Requested by', text: 'Atlas Immobilier — Bureau technique' },
        ],
      },
      {
        id: 'm2',
        author: 'Amine Bennani',
        role: 'Admin',
        initials: 'AB',
        when: '18 hours ago',
        body: [
          { label: 'Reply', text: 'Received. Engineering is revising the drainage branch. Awaiting updated DWG before we reopen for your review.' },
        ],
      },
    ],
  },
  '0189f22c': {
    messages: [
      {
        id: 'm1',
        author: 'Nadia Ouarzazi',
        role: 'Chef de chantier',
        initials: 'NO',
        when: '3 days ago',
        body: [
          { label: 'Issue', text: 'Safety inspection blocked — échafaudage checklist incomplete on north face.' },
          { label: 'Reproduction steps', text: 'Inspector visit 08:40. Missing guardrail tags on levels 2–3.' },
          { label: 'State ID', text: 'CHK-SEC-441' },
          { label: 'Character / Crew', text: 'Team Bravo' },
          { label: 'Faction', text: 'Site Ops' },
        ],
      },
    ],
  },
  '0188c10a': {
    messages: [
      {
        id: 'm1',
        author: 'Karim El Amrani',
        role: 'Client',
        initials: 'KE',
        when: '9 months ago',
        body: [
          { label: 'Issue', text: 'Need custom plates for site vehicles entering restricted marina zone.' },
          { label: 'Quantity', text: '6 vehicles' },
        ],
      },
      {
        id: 'm2',
        author: 'Amine Bennani',
        role: 'Admin',
        initials: 'AB',
        when: '9 months ago',
        body: [
          { label: 'Resolution', text: 'Plates issued and logged under LOG-2025-118. Ticket closed.' },
        ],
      },
    ],
  },
  '0187b55d': {
    messages: [
      {
        id: 'm1',
        author: 'Hassan Alaoui',
        role: 'Client',
        initials: 'HA',
        when: '5 days ago',
        body: [
          { label: 'Issue', text: 'FAC-2026-008 total does not match accepted devis DEV-2026-014 situation n°1.' },
          { label: 'Expected TTC', text: '540.000 MAD' },
          { label: 'Invoiced TTC', text: '612.000 MAD' },
        ],
      },
      {
        id: 'm2',
        author: 'Amine Bennani',
        role: 'Admin',
        initials: 'AB',
        when: '4 days ago',
        body: [
          { label: 'Reply', text: 'Finance is reconciling the tax line. We will send a credit note draft for validation.' },
        ],
      },
    ],
  },
  '0186a90f': {
    messages: [
      {
        id: 'm1',
        author: 'Karim El Amrani',
        role: 'Team',
        initials: 'KE',
        when: '1 week ago',
        body: [
          { label: 'Issue', text: 'New ingénieur needs project.view + document.upload on Médiouna chantier.' },
        ],
      },
      {
        id: 'm2',
        author: 'Amine Bennani',
        role: 'Admin',
        initials: 'AB',
        when: '1 week ago',
        body: [
          { label: 'Resolution', text: 'Role “Ingénieur” assigned. Access confirmed.' },
        ],
      },
    ],
  },
  '0185e12a': {
    messages: [
      {
        id: 'm1',
        author: 'Hassan Alaoui',
        role: 'Client',
        initials: 'HA',
        when: '2 weeks ago',
        body: [
          { label: 'Issue', text: 'Lot boundary polyline needs update after cadastral correction.' },
        ],
      },
      {
        id: 'm2',
        author: 'Nadia Ouarzazi',
        role: 'Chef de chantier',
        initials: 'NO',
        when: '2 weeks ago',
        body: [
          { label: 'Resolution', text: 'Boundary updated in project lots. Maps refreshed for the commune.' },
        ],
      },
    ],
  },
}

export const TICKET_PROJECTS = [
  { id: '1', label: 'Route de liaison Médiouna', client: 'Commune de Médiouna' },
  { id: '2', label: 'Immeuble Atlas R+4', client: 'Atlas Immobilier' },
  { id: '3', label: 'Chantier Marina', client: 'Marina Développement' },
]

export const TICKET_CATEGORIES = [
  'Amendments',
  'Site Operations',
  'Billing',
  'Logistics',
  'Access Control',
  'Feedback & Suggestions',
  'Documents',
  'Other',
]

/** Mutable runtime copies so newly created tickets appear in the list. */
const ticketList = [...TICKETS]
const ticketThreads = { ...TICKET_THREADS }

export function statusLabel(status) {
  if (status === 'open') return 'Open'
  if (status === 'awaiting') return 'Awaiting Reply'
  if (status === 'resolved') return 'Resolved'
  return status
}

export function getTickets() {
  return ticketList
}

export function getTicketById(id) {
  return ticketList.find((ticket) => ticket.id === id) ?? null
}

export function getTicketThread(id) {
  return ticketThreads[id] ?? { messages: [] }
}

function makeTicketId() {
  return `019${Math.random().toString(16).slice(2, 8)}`
}

/**
 * Create a new ticket conversation from the New Ticket form.
 * @returns {{ id: string }}
 */
export function createTicket({ title, projectId, category, description }) {
  const project = TICKET_PROJECTS.find((item) => item.id === String(projectId))
  const id = makeTicketId()
  const trimmedDescription = description.trim()

  const ticket = {
    id,
    title: title.trim(),
    category,
    when: 'Just now',
    status: 'open',
    project: project?.label ?? 'Unassigned project',
    client: project?.client ?? 'Unknown client',
  }

  ticketList.unshift(ticket)
  ticketThreads[id] = {
    messages: [
      {
        id: `m-${id}-1`,
        author: 'Amine Bennani',
        role: 'Admin',
        initials: 'AB',
        when: 'Just now',
        body: parseDescriptionBlocks(trimmedDescription),
      },
    ],
  }

  return ticket
}

function parseDescriptionBlocks(description) {
  if (!description) {
    return [{ label: 'Description', text: '(No description provided)' }]
  }

  const lines = description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const labeled = []

  for (const line of lines) {
    const match = line.match(/^([^:]{2,40}):\s*(.*)$/)
    if (match) {
      labeled.push({ label: match[1], text: match[2] || '—' })
    }
  }

  if (labeled.length > 0) return labeled
  return [{ label: 'Description', text: description }]
}
