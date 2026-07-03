import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHomePathForRole } from '../routes/routeAccess'

export default function AdminRoute() {
  const { isAdmin, user, roles } = useAuth()

  if (!isAdmin) {
    return <Navigate to={getHomePathForRole(user?.role, user, roles)} replace />
  }

  return <Outlet />
}
