/**
 * API stubs used when VITE_UI_ONLY=true.
 * Swap payloads in ./seedData.js to redesign screens with different content density.
 */
import {
  MOCK_AUTH_CONTEXT,
  MOCK_DASHBOARD_SUMMARY,
  allocId,
  listCollection,
  uiStore,
} from './seedData'

function wrap(item) {
  return { data: item }
}

export async function login() {
  return structuredClone(MOCK_AUTH_CONTEXT)
}

export async function logout() {
  return { ok: true }
}

export async function fetchMe() {
  return structuredClone(MOCK_AUTH_CONTEXT)
}

export async function fetchDashboardSummary() {
  return structuredClone(MOCK_DASHBOARD_SUMMARY)
}

export async function fetchClients(params = {}) {
  return listCollection('clients', params)
}

export async function fetchClient(id) {
  const client = uiStore.clients.find((item) => String(item.id) === String(id))
  if (!client) throw Object.assign(new Error('Client not found'), { response: { status: 404 } })
  return wrap(client)
}

export async function createClient(payload) {
  const client = {
    id: allocId(),
    company_id: 1,
    projects_count: 0,
    is_active: true,
    country: 'MA',
    ...payload,
  }
  uiStore.clients.unshift(client)
  return wrap(client)
}

export async function updateClient(id, payload) {
  const index = uiStore.clients.findIndex((item) => String(item.id) === String(id))
  if (index === -1) throw Object.assign(new Error('Client not found'), { response: { status: 404 } })
  uiStore.clients[index] = { ...uiStore.clients[index], ...payload }
  return wrap(uiStore.clients[index])
}

export async function deleteClient(id) {
  uiStore.clients = uiStore.clients.filter((item) => String(item.id) !== String(id))
  return { ok: true }
}

export async function fetchProjects(params = {}) {
  return listCollection('projects', params)
}

export async function fetchProject(id) {
  const project = uiStore.projects.find((item) => String(item.id) === String(id))
  if (!project) throw Object.assign(new Error('Project not found'), { response: { status: 404 } })
  return wrap(project)
}

export async function createProject(payload) {
  const client = uiStore.clients.find((item) => String(item.id) === String(payload.client_id))
  const project = {
    id: allocId(),
    company_id: 1,
    reference: `PRJ-2026-${String(allocId()).slice(-3)}`,
    progress_percent: 0,
    status: payload.status ?? 'planned',
    lots: [],
    phases: [],
    team_members: [],
    client: client ? { id: client.id, name: client.name } : null,
    ...payload,
  }
  uiStore.projects.unshift(project)
  return wrap(project)
}

export async function updateProject(id, payload) {
  const index = uiStore.projects.findIndex((item) => String(item.id) === String(id))
  if (index === -1) throw Object.assign(new Error('Project not found'), { response: { status: 404 } })
  uiStore.projects[index] = { ...uiStore.projects[index], ...payload }
  return wrap(uiStore.projects[index])
}

export async function deleteProject(id) {
  uiStore.projects = uiStore.projects.filter((item) => String(item.id) !== String(id))
  return { ok: true }
}

export async function fetchCompanyUsers() {
  return {
    data: [
      { id: 1, full_name: 'Amine Bennani', email: 'admin@btpdemo.fr' },
      { id: 2, full_name: 'Nadia Ouarzazi', email: 'nadia@btpdemo.fr' },
      { id: 3, full_name: 'Karim El Amrani', email: 'karim@btpdemo.fr' },
    ],
  }
}

export async function createPhase() {
  return wrap({ id: allocId(), name: 'Nouvelle phase', sort_order: 0, tasks: [] })
}

export async function updatePhase(phaseId, payload) {
  return wrap({ id: phaseId, ...payload })
}

export async function deletePhase() {
  return { ok: true }
}

export async function createTask(phaseId, payload) {
  return wrap({ id: allocId(), phase_id: phaseId, status: 'todo', ...payload })
}

export async function updateTask(taskId, payload) {
  return wrap({ id: taskId, ...payload })
}

export async function deleteTask() {
  return { ok: true }
}

export async function addTeamMember(projectId, payload) {
  return wrap({ project_id: projectId, ...payload })
}

export async function removeTeamMember() {
  return { ok: true }
}

export async function fetchProgressSnapshots() {
  return {
    data: [
      { id: 1, progress_percent: 20, note: 'Démarrage terrassement', recorded_at: '2026-04-01T10:00:00.000Z' },
      { id: 2, progress_percent: 42, note: 'Fin couche de forme', recorded_at: '2026-06-10T10:00:00.000Z' },
    ],
  }
}

export async function createProgressSnapshot(projectId, payload) {
  return wrap({ id: allocId(), project_id: projectId, ...payload })
}

export async function fetchQuotes(params = {}) {
  return listCollection('quotes', params)
}

export async function fetchQuote(id) {
  const quote = uiStore.quotes.find((item) => String(item.id) === String(id))
  if (!quote) throw Object.assign(new Error('Quote not found'), { response: { status: 404 } })
  return wrap(quote)
}

export async function createQuote(payload) {
  const client = uiStore.clients.find((item) => String(item.id) === String(payload.client_id))
  const project = uiStore.projects.find((item) => String(item.id) === String(payload.project_id))
  const quote = {
    id: allocId(),
    reference: `DEV-2026-${String(allocId()).slice(-3)}`,
    status: 'draft',
    total_ht: 0,
    total_tax: 0,
    total_ttc: 0,
    lines: [],
    client: client ? { id: client.id, name: client.name } : null,
    project: project
      ? { id: project.id, reference: project.reference, title: project.title }
      : null,
    ...payload,
  }
  uiStore.quotes.unshift(quote)
  return wrap(quote)
}

export async function updateQuote(id, payload) {
  const index = uiStore.quotes.findIndex((item) => String(item.id) === String(id))
  if (index === -1) throw Object.assign(new Error('Quote not found'), { response: { status: 404 } })
  uiStore.quotes[index] = { ...uiStore.quotes[index], ...payload }
  return wrap(uiStore.quotes[index])
}

export async function deleteQuote(id) {
  uiStore.quotes = uiStore.quotes.filter((item) => String(item.id) !== String(id))
  return { ok: true }
}

export async function convertQuoteToInvoice(id) {
  const quote = uiStore.quotes.find((item) => String(item.id) === String(id))
  const invoice = {
    id: allocId(),
    reference: `FAC-2026-${String(allocId()).slice(-3)}`,
    status: 'draft',
    issued_at: new Date().toISOString().slice(0, 10),
    due_date: null,
    notes: quote?.notes ?? '',
    total_ht: quote?.total_ht ?? 0,
    total_tax: quote?.total_tax ?? 0,
    total_ttc: quote?.total_ttc ?? 0,
    amount_paid: 0,
    balance_due: quote?.total_ttc ?? 0,
    client: quote?.client ?? null,
    project: quote?.project ?? null,
    quote: quote ? { id: quote.id, reference: quote.reference } : null,
    lines: quote?.lines ?? [],
    payments: [],
  }
  uiStore.invoices.unshift(invoice)
  return wrap(invoice)
}

export async function addQuoteLine(quoteId, payload) {
  return wrap({ id: allocId(), quote_id: quoteId, ...payload })
}

export async function updateQuoteLine(lineId, payload) {
  return wrap({ id: lineId, ...payload })
}

export async function deleteQuoteLine() {
  return { ok: true }
}

export async function fetchInvoices(params = {}) {
  return listCollection('invoices', params)
}

export async function fetchInvoice(id) {
  const invoice = uiStore.invoices.find((item) => String(item.id) === String(id))
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { response: { status: 404 } })
  return wrap(invoice)
}

export async function createInvoice(payload) {
  const client = uiStore.clients.find((item) => String(item.id) === String(payload.client_id))
  const invoice = {
    id: allocId(),
    reference: `FAC-2026-${String(allocId()).slice(-3)}`,
    status: 'draft',
    total_ht: 0,
    total_tax: 0,
    total_ttc: 0,
    amount_paid: 0,
    balance_due: 0,
    lines: [],
    payments: [],
    client: client ? { id: client.id, name: client.name } : null,
    project: null,
    quote: null,
    ...payload,
  }
  uiStore.invoices.unshift(invoice)
  return wrap(invoice)
}

export async function updateInvoice(id, payload) {
  const index = uiStore.invoices.findIndex((item) => String(item.id) === String(id))
  if (index === -1) throw Object.assign(new Error('Invoice not found'), { response: { status: 404 } })
  uiStore.invoices[index] = { ...uiStore.invoices[index], ...payload }
  return wrap(uiStore.invoices[index])
}

export async function deleteInvoice(id) {
  uiStore.invoices = uiStore.invoices.filter((item) => String(item.id) !== String(id))
  return { ok: true }
}

export async function addInvoiceLine(invoiceId, payload) {
  return wrap({ id: allocId(), invoice_id: invoiceId, ...payload })
}

export async function updateInvoiceLine(lineId, payload) {
  return wrap({ id: lineId, ...payload })
}

export async function deleteInvoiceLine() {
  return { ok: true }
}

export async function recordPayment(invoiceId, payload) {
  return wrap({ id: allocId(), invoice_id: invoiceId, ...payload })
}

export async function deletePayment() {
  return { ok: true }
}

export async function fetchUnreadNotifications() {
  const unread = uiStore.notifications.filter((item) => !item.read_at)
  return {
    items: unread,
    unreadCount: unread.length,
  }
}

export async function markNotificationAsRead(notificationId) {
  const item = uiStore.notifications.find((n) => String(n.id) === String(notificationId))
  if (item) item.read_at = new Date().toISOString()
  const unreadCount = uiStore.notifications.filter((n) => !n.read_at).length
  return { item, unreadCount }
}

export async function fetchProjectExpenses(projectId) {
  return { data: uiStore.expensesByProject[projectId] ?? [] }
}

export async function createExpense(projectId, payload) {
  const expense = { id: allocId(), ...payload }
  if (!uiStore.expensesByProject[projectId]) uiStore.expensesByProject[projectId] = []
  uiStore.expensesByProject[projectId].unshift(expense)
  return wrap(expense)
}

export async function updateExpense(expenseId, payload) {
  return wrap({ id: expenseId, ...payload })
}

export async function deleteExpense() {
  return { ok: true }
}

export async function fetchProjectDocuments(projectId) {
  return { data: uiStore.documentsByProject[projectId] ?? [] }
}

export async function uploadDocument(projectId, payload) {
  const doc = {
    id: allocId(),
    name: payload?.name ?? 'document.pdf',
    category: payload?.category ?? 'other',
    status: 'active',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    created_at: new Date().toISOString(),
  }
  if (!uiStore.documentsByProject[projectId]) uiStore.documentsByProject[projectId] = []
  uiStore.documentsByProject[projectId].unshift(doc)
  return wrap(doc)
}

export async function archiveDocument(documentId) {
  return wrap({ id: documentId, status: 'archived' })
}
