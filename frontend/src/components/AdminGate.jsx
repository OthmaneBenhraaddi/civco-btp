import { useAuth } from '../../context/AuthContext'

export default function AdminGate({ children, fallback = null }) {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return fallback
  }

  return children
}
