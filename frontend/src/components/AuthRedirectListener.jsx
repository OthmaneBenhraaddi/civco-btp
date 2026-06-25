import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthRedirectListener() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleUnauthorized() {
      navigate('/login', { replace: true })
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [navigate])

  return null
}
