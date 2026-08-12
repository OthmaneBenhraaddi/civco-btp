/**
 * Temporary seed payloads for frontend-only UI work.
 * Edit these freely to stress-test layouts, empty states, and dense tables.
 */

export const MOCK_PERMISSIONS = [
  'dashboard.view',
  'user.view',
  'user.create',
  'user.update',
  'user.delete',
  'role.view',
  'role.manage',
  'company.view',
  'company.manage',
  'client.view',
  'client.create',
  'client.update',
  'client.delete',
  'project.view',
  'project.create',
  'project.update',
  'project.delete',
  'document.view',
  'document.upload',
  'document.archive',
  'quote.view',
  'quote.manage',
  'invoice.view',
  'invoice.manage',
  'payment.record',
  'expense.view',
  'expense.manage',
  'task.view_all',
  'task.view_own',
  'task.assign',
  'task.update',
  'project.budget',
]

export const MOCK_AUTH_CONTEXT = {
  user: {
    id: 1,
    first_name: 'Amine',
    last_name: 'Bennani',
    full_name: 'Amine Bennani',
    email: 'admin@btpdemo.fr',
    phone: '+212 6 00 00 00 00',
  },
  company: {
    id: 1,
    name: 'Civco BTP Groupe',
    visibility: 'private',
  },
  companies: [{ id: 1, name: 'Civco BTP Groupe', is_primary: true }],
  roles: [{ id: 1, name: 'Admin / Gérant', slug: 'super_admin' }],
  permissions: MOCK_PERMISSIONS,
}

export const MOCK_CLIENTS = [
  {
    id: 1,
    company_id: 1,
    name: 'Commune de Médiouna',
    contact_name: 'Hassan Alaoui',
    email: 'travaux@mediouna.ma',
    phone: '+212 5 22 00 11 22',
    address_line1: 'Avenue Hassan II',
    city: 'Médiouna',
    postal_code: '27182',
    country: 'MA',
    notes: 'Marché public VRD',
    is_active: true,
    projects_count: 2,
  },
  {
    id: 2,
    company_id: 1,
    name: 'Atlas Immobilier',
    contact_name: 'Sara Benali',
    email: 'sara@atlas-immo.ma',
    phone: '+212 5 22 33 44 55',
    address_line1: 'Bd Zerktouni',
    city: 'Casablanca',
    postal_code: '20000',
    country: 'MA',
    notes: '',
    is_active: true,
    projects_count: 1,
  },
  {
    id: 3,
    company_id: 1,
    name: 'Marina Développement',
    contact_name: 'Karim El Amrani',
    email: 'karim@marina.ma',
    phone: '+212 5 24 66 77 88',
    address_line1: 'Corniche',
    city: 'Rabat',
    postal_code: '10000',
    country: 'MA',
    notes: 'Client privé — lotissement',
    is_active: true,
    projects_count: 1,
  },
]

export const MOCK_PROJECTS = [
  {
    id: 1,
    company_id: 1,
    client_id: 1,
    reference: 'PRJ-2026-001',
    title: 'Route de liaison Médiouna',
    description: 'Travaux VRD — voirie et assainissement',
    status: 'in_progress',
    nature: 'VRD',
    sector: 'PUBLIC',
    etat_paiement: 'NON PAYÉ',
    delais: '8 mois',
    avancement: 'Phase terrassement',
    start_date: '2026-03-01',
    end_date: '2026-11-30',
    budget: 2450000,
    progress_percent: 42,
    site_city: 'Médiouna',
    client: { id: 1, name: 'Commune de Médiouna' },
    lots: [
      { id: 1, lot_name: 'Voirie', sort_order: 0 },
      { id: 2, lot_name: 'Assainissement', sort_order: 1 },
    ],
    phases: [
      {
        id: 1,
        name: 'Études',
        sort_order: 0,
        tasks: [
          { id: 101, title: 'Levés topographiques', status: 'done' },
          { id: 102, title: 'Dossier technique', status: 'in_progress' },
        ],
      },
      {
        id: 2,
        name: 'Exécution',
        sort_order: 1,
        tasks: [
          { id: 103, title: 'Terrassement', status: 'in_progress' },
        ],
      },
    ],
    team_members: [
      { id: 1, full_name: 'Amine Bennani', email: 'admin@btpdemo.fr', role_label: 'Chef de projet' },
      { id: 2, full_name: 'Nadia Ouarzazi', email: 'nadia@btpdemo.fr', role_label: 'Chef de chantier' },
    ],
  },
  {
    id: 2,
    company_id: 1,
    client_id: 2,
    reference: 'PRJ-2026-002',
    title: 'Immeuble Atlas R+4',
    description: 'Construction bâtiment R+4',
    status: 'planned',
    nature: 'BÂTIMENT',
    sector: 'PRIVÉ',
    etat_paiement: 'NON PAYÉ',
    delais: '14 mois',
    avancement: 'Avant-projet',
    start_date: '2026-07-01',
    end_date: '2027-09-01',
    budget: 8900000,
    progress_percent: 12,
    site_city: 'Casablanca',
    client: { id: 2, name: 'Atlas Immobilier' },
    lots: [{ id: 3, lot_name: 'Gros œuvre', sort_order: 0 }],
    phases: [],
    team_members: [],
  },
  {
    id: 3,
    company_id: 1,
    client_id: 3,
    reference: 'PRJ-2026-003',
    title: 'Chantier Marina',
    description: 'Aménagement lotissement côtier',
    status: 'on_hold',
    nature: 'VRD',
    sector: 'PRIVÉ',
    etat_paiement: 'PAYÉ',
    delais: '10 mois',
    avancement: 'En attente permis',
    start_date: '2026-01-15',
    end_date: '2026-12-15',
    budget: 3200000,
    progress_percent: 28,
    site_city: 'Rabat',
    client: { id: 3, name: 'Marina Développement' },
    lots: [],
    phases: [],
    team_members: [],
  },
]

export const MOCK_QUOTES = [
  {
    id: 1,
    reference: 'DEV-2026-014',
    status: 'sent',
    issued_at: '2026-06-01',
    valid_until: '2026-07-01',
    notes: 'Devis VRD Médiouna — lot voirie',
    total_ht: 980000,
    total_tax: 196000,
    total_ttc: 1176000,
    client: { id: 1, name: 'Commune de Médiouna' },
    project: { id: 1, reference: 'PRJ-2026-001', title: 'Route de liaison Médiouna' },
    lines: [
      { id: 1, description: 'Terrassement général', quantity: 1, unit_price: 420000, tax_rate: 20, total_ht: 420000 },
      { id: 2, description: 'Couche de forme', quantity: 1, unit_price: 560000, tax_rate: 20, total_ht: 560000 },
    ],
  },
  {
    id: 2,
    reference: 'DEV-2026-015',
    status: 'accepted',
    issued_at: '2026-05-12',
    valid_until: '2026-06-12',
    notes: '',
    total_ht: 2100000,
    total_tax: 420000,
    total_ttc: 2520000,
    client: { id: 2, name: 'Atlas Immobilier' },
    project: { id: 2, reference: 'PRJ-2026-002', title: 'Immeuble Atlas R+4' },
    lines: [],
  },
]

export const MOCK_INVOICES = [
  {
    id: 1,
    reference: 'FAC-2026-008',
    status: 'partially_paid',
    issued_at: '2026-05-20',
    due_date: '2026-06-20',
    notes: 'Situation n°1',
    total_ht: 450000,
    total_tax: 90000,
    total_ttc: 540000,
    amount_paid: 200000,
    balance_due: 340000,
    client: { id: 1, name: 'Commune de Médiouna' },
    project: { id: 1, reference: 'PRJ-2026-001', title: 'Route de liaison Médiouna' },
    quote: { id: 1, reference: 'DEV-2026-014' },
    lines: [
      { id: 1, description: 'Situation terrassement', quantity: 1, unit_price: 450000, tax_rate: 20, total_ht: 450000 },
    ],
    payments: [
      { id: 1, amount: 200000, method: 'transfer', paid_at: '2026-05-28', notes: 'Acompte' },
    ],
  },
  {
    id: 2,
    reference: 'FAC-2026-009',
    status: 'sent',
    issued_at: '2026-06-05',
    due_date: '2026-07-05',
    notes: '',
    total_ht: 1200000,
    total_tax: 240000,
    total_ttc: 1440000,
    amount_paid: 0,
    balance_due: 1440000,
    client: { id: 2, name: 'Atlas Immobilier' },
    project: { id: 2, reference: 'PRJ-2026-002', title: 'Immeuble Atlas R+4' },
    quote: null,
    lines: [],
    payments: [],
  },
]

export const MOCK_DASHBOARD_SUMMARY = {
  projects: {
    total: 3,
    by_status: {
      planned: 1,
      in_progress: 1,
      on_hold: 1,
    },
    active_count: 3,
    average_progress: 27.33,
  },
  financial: {
    total_revenue: 200000,
    outstanding_balance: 1780000,
    overdue_invoices_count: 1,
    total_expenses: 185000,
  },
  recent_projects: MOCK_PROJECTS.map((project) => ({
    id: project.id,
    reference: project.reference,
    title: project.title,
    status: project.status,
    progress_percent: project.progress_percent,
    client_name: project.client?.name,
  })),
}

export const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Facture en retard',
    message: 'FAC-2026-008 — solde restant 340.000 MAD',
    type: 'invoice',
    read_at: null,
    created_at: '2026-06-16T09:15:00.000Z',
  },
  {
    id: 2,
    title: 'Nouveau document',
    message: 'Plans V3 ajoutés sur Route de liaison Médiouna',
    type: 'document',
    read_at: null,
    created_at: '2026-06-15T16:40:00.000Z',
  },
]

export const MOCK_EXPENSES = [
  {
    id: 1,
    category: 'materials',
    description: 'Ciment & acier',
    amount: 128500,
    incurred_on: '2026-06-10',
    vendor: 'Matériaux Atlas',
  },
  {
    id: 2,
    category: 'equipment',
    description: 'Location pelle mécanique',
    amount: 18500,
    incurred_on: '2026-06-12',
    vendor: 'LocEngins',
  },
]

export const MOCK_DOCUMENTS = [
  {
    id: 1,
    name: 'plans-v3.pdf',
    category: 'plans',
    status: 'active',
    mime_type: 'application/pdf',
    size_bytes: 2457600,
    created_at: '2026-06-15T16:40:00.000Z',
  },
  {
    id: 2,
    name: 'pv-reception.docx',
    category: 'admin',
    status: 'active',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size_bytes: 184320,
    created_at: '2026-06-10T11:00:00.000Z',
  },
]

function paginate(items, params = {}) {
  const page = Number(params.page) || 1
  const perPage = Number(params.per_page) || 15
  const search = String(params.search ?? '').trim().toLowerCase()
  const status = params.status

  let filtered = [...items]

  if (search) {
    filtered = filtered.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(search),
    )
  }

  if (status) {
    filtered = filtered.filter((item) => item.status === status)
  }

  if (params.is_active !== undefined) {
    const active = params.is_active === true || params.is_active === 'true' || params.is_active === 1
    filtered = filtered.filter((item) => Boolean(item.is_active) === active)
  }

  const total = filtered.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage
  const data = filtered.slice(start, start + perPage)

  return {
    data,
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      total,
    },
  }
}

/** Mutable in-memory copies so create/update/delete still feel interactive in UI mode. */
export const uiStore = {
  clients: structuredClone(MOCK_CLIENTS),
  projects: structuredClone(MOCK_PROJECTS),
  quotes: structuredClone(MOCK_QUOTES),
  invoices: structuredClone(MOCK_INVOICES),
  notifications: structuredClone(MOCK_NOTIFICATIONS),
  expensesByProject: {
    1: structuredClone(MOCK_EXPENSES),
    2: [],
    3: structuredClone(MOCK_EXPENSES).slice(0, 1),
  },
  documentsByProject: {
    1: structuredClone(MOCK_DOCUMENTS),
    2: [],
    3: [],
  },
  nextId: 100,
}

export function listCollection(key, params) {
  return paginate(uiStore[key], params)
}

export function allocId() {
  uiStore.nextId += 1
  return uiStore.nextId
}
