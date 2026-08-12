import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import DashboardPage from '../features/dashboard/DashboardPage'
import ClientsPage from '../features/clients/ClientsPage'
import ProjectsPage from '../features/projects/ProjectsPage'
import ProjectDetailPage from '../features/projects/ProjectDetailPage'
import QuotesPage from '../features/quotes/QuotesPage'
import QuoteDetailPage from '../features/quotes/QuoteDetailPage'
import InvoicesPage from '../features/invoices/InvoicesPage'
import InvoiceDetailPage from '../features/invoices/InvoiceDetailPage'
import TasksPage from '../features/tasks/TasksPage'
import HistoryPage from '../features/history/HistoryPage'
import RolesPage from '../features/roles/RolesPage'
import TicketsPage from '../features/tickets/TicketsPage'
import TicketDetailPage from '../features/tickets/TicketDetailPage'
import NewTicketPage from '../features/tickets/NewTicketPage'
import AppLayout from '../layouts/AppLayout'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <div className="h-full overflow-hidden">
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="quotes" element={<QuotesPage />} />
              <Route path="quotes/:id" element={<QuoteDetailPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/new" element={<NewTicketPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="history" element={<HistoryPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
