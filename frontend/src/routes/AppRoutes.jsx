import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from '../components/AdminRoute'
import AuthRedirectListener from '../components/AuthRedirectListener'
import GuestRoute from '../components/GuestRoute'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from '../features/auth/LoginPage'
import DashboardPage from '../features/dashboard/DashboardPage'
import ClientsPage from '../features/clients/ClientsPage'
import ProjectMapPage from '../features/map/ProjectMapPage'
import ProjectsPage from '../features/projects/ProjectsPage'
import ProjectDetailPage from '../features/projects/ProjectDetailPage'
import QuotesPage from '../features/quotes/QuotesPage'
import QuoteDetailPage from '../features/quotes/QuoteDetailPage'
import DeliveryFormsPage from '../features/delivery-forms/DeliveryFormsPage'
import DeliveryFormDetailPage from '../features/delivery-forms/DeliveryFormDetailPage'
import InvoicesPage from '../features/invoices/InvoicesPage'
import InvoiceDetailPage from '../features/invoices/InvoiceDetailPage'
import TasksPage from '../features/tasks/TasksPage'
import HistoryPage from '../features/history/HistoryPage'
import ClientPortalDashboardPage from '../features/client-portal/ClientPortalDashboardPage'
import ClientPortalDiscussionsPage from '../features/client-portal/ClientPortalDiscussionsPage'
import ClientPortalCalendarPage from '../features/client-portal/ClientPortalCalendarPage'
import ClientPortalQuotesPage from '../features/client-portal/ClientPortalQuotesPage'
import ClientPortalQuoteDetailPage from '../features/client-portal/ClientPortalQuoteDetailPage'
import ConfigurationPage from '../features/configuration/ConfigurationPage'
import RolesPage from '../features/roles/RolesPage'
import SuperAdminDashboard from '../features/super-admin/SuperAdminDashboard'
import AdminMessagingPage from '../features/messaging/AdminMessagingPage'
import TeamManagementPage from '../features/team/TeamManagementPage'
import SuperAdminRoute from '../components/SuperAdminRoute'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthRedirectListener />

      <div className="h-full overflow-hidden">
        <Routes>
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="portal" element={<ClientPortalDashboardPage />} />
              <Route path="portal/discussions" element={<ClientPortalDiscussionsPage />} />
              <Route path="portal/calendar" element={<ClientPortalCalendarPage />} />
              <Route path="portal/quotes" element={<ClientPortalQuotesPage />} />
              <Route path="portal/quotes/:id" element={<ClientPortalQuoteDetailPage />} />
              <Route index element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="map" element={<ProjectMapPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />

              <Route element={<SuperAdminRoute />}>
                <Route path="super-admin" element={<SuperAdminDashboard />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="clients" element={<ClientsPage />} />
                <Route path="quotes" element={<QuotesPage />} />
                <Route path="quotes/:id" element={<QuoteDetailPage />} />
                <Route path="delivery-forms" element={<DeliveryFormsPage />} />
                <Route path="delivery-forms/:id" element={<DeliveryFormDetailPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="invoices/:id" element={<InvoiceDetailPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="configuration" element={<ConfigurationPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="discussions" element={<AdminMessagingPage />} />
                <Route path="team" element={<TeamManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
