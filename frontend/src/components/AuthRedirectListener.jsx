import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { appendTenantQuery } from '../utils/tenantDevContext'

export default function AuthRedirectListener() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleUnauthorized() {
      navigate(appendTenantQuery('/login'), { replace: true })
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [navigate])

  return null
}
