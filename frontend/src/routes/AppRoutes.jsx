import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminRoute from '../components/AdminRoute'
import AuthRedirectListener from '../components/AuthRedirectListener'
import GuestRoute from '../components/GuestRoute'
import ProtectedRoute from '../components/ProtectedRoute'
import LoginPage from '../features/auth/LoginPage'
import LandingPage from '../features/landing/LandingPage'
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
import ClientPortalCalendarPage from '../features/client-portal/ClientPortalCalendarPage'
import ClientPortalQuotesPage from '../features/client-portal/ClientPortalQuotesPage'
import ClientPortalQuoteDetailPage from '../features/client-portal/ClientPortalQuoteDetailPage'
import ConfigurationPage from '../features/configuration/ConfigurationPage'
import RolesPage from '../features/roles/RolesPage'
import SuperAdminOverviewPage from '../features/super-admin/SuperAdminOverviewPage'
import SuperAdminEntitiesPage from '../features/super-admin/SuperAdminEntitiesPage'
import SuperAdminCreateEntityPage from '../features/super-admin/SuperAdminCreateEntityPage'
import SuperAdminDemoCodesPage from '../features/super-admin/SuperAdminDemoCodesPage'
import SuperAdminDemoRequestsPage from '../features/super-admin/SuperAdminDemoRequestsPage'
import SuperAdminMembersPage from '../features/super-admin/SuperAdminMembersPage'
import SuperAdminSystemLogsPage from '../features/super-admin/SuperAdminSystemLogsPage'
import SuperAdminHomepagePage from '../features/super-admin/SuperAdminHomepagePage'
import TicketsPage from '../features/tickets/TicketsPage'
import NewTicketPage from '../features/tickets/NewTicketPage'
import TicketDetailPage from '../features/tickets/TicketDetailPage'
import TeamManagementPage from '../features/team/TeamManagementPage'
import ProfileSettingsPage from '../features/profile/ProfileSettingsPage'
import SuperAdminRoute from '../components/SuperAdminRoute'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthRedirectListener />

      <div className="h-full overflow-hidden">
        <Routes>
          {/* Public marketing homepage — available to guests and authenticated users. */}
          <Route path="/" element={<LandingPage />} />

          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="portal" element={<ClientPortalDashboardPage />} />
              <Route path="portal/discussions" element={<Navigate to="/portal/tickets" replace />} />
              <Route path="portal/tickets" element={<TicketsPage />} />
              <Route path="portal/tickets/new" element={<NewTicketPage />} />
              <Route path="portal/tickets/:id" element={<TicketDetailPage />} />
              <Route path="portal/calendar" element={<ClientPortalCalendarPage />} />
              <Route path="portal/quotes" element={<ClientPortalQuotesPage />} />
              <Route path="portal/quotes/:id" element={<ClientPortalQuoteDetailPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="map" element={<ProjectMapPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />

              <Route path="clients" element={<ClientsPage />} />
              <Route path="quotes" element={<QuotesPage />} />
              <Route path="quotes/:id" element={<QuoteDetailPage />} />
              <Route path="delivery-forms" element={<DeliveryFormsPage />} />
              <Route path="delivery-forms/:id" element={<DeliveryFormDetailPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
              <Route path="discussions" element={<Navigate to="/tickets" replace />} />
              <Route path="tickets" element={<TicketsPage />} />
              <Route path="tickets/new" element={<NewTicketPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />

              <Route path="super-admin" element={<SuperAdminRoute />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<SuperAdminOverviewPage />} />
                <Route path="entities" element={<SuperAdminEntitiesPage />} />
                <Route path="create" element={<SuperAdminCreateEntityPage />} />
                <Route path="demo-codes" element={<SuperAdminDemoCodesPage />} />
                <Route path="demo-requests" element={<SuperAdminDemoRequestsPage />} />
                <Route path="members" element={<SuperAdminMembersPage />} />
                <Route path="logs" element={<SuperAdminSystemLogsPage />} />
                <Route path="homepage" element={<SuperAdminHomepagePage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="roles" element={<RolesPage />} />
                <Route path="configuration" element={<ConfigurationPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="team" element={<TeamManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="superadmin/homepage" element={<Navigate to="/super-admin/homepage" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
