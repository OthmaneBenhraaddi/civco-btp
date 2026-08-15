import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { appendTenantQuery } from '../utils/tenantDevContext'
import { locationToReturnPath } from '../utils/returnPath'

const PUBLIC_PATHS = new Set(['/', '/login'])

export default function AuthRedirectListener() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  useEffect(() => {
    function handleUnauthorized() {
      if (PUBLIC_PATHS.has(location.pathname)) {
        return
      }
      navigate(appendTenantQuery('/login'), {
        replace: true,
        state: { from: locationToReturnPath(location) },
      })
    }

    async function handleDemoExpired() {
      try {
        await logout()
      } finally {
        navigate('/?demo=expired', { replace: true })
      }
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    window.addEventListener('auth:demo-expired', handleDemoExpired)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
      window.removeEventListener('auth:demo-expired', handleDemoExpired)
    }
  }, [navigate, location, logout])

  return null
}
