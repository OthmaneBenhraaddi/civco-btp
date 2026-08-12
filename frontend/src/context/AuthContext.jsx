import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { setActiveCompanyId } from '../api/client'
import { isUiOnlyMode } from '../mocks/uiOnlyMode'
import { MOCK_AUTH_CONTEXT } from '../mocks/seedData'

const AuthContext = createContext(null)

const DEMO_CREDENTIALS = {
  email: import.meta.env.VITE_DEMO_EMAIL ?? 'admin@btpdemo.fr',
  password: import.meta.env.VITE_DEMO_PASSWORD ?? 'password',
}

const EMPTY_CONTEXT = {
  user: null,
  company: null,
  companies: [],
  roles: [],
  permissions: [],
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [companies, setCompanies] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [bootstrapError, setBootstrapError] = useState('')

  const applyContext = useCallback((context) => {
    setUser(context.user)
    setCompany(context.company)
    setCompanies(context.companies ?? [])
    setRoles(context.roles ?? [])
    setPermissions(context.permissions ?? [])
    setActiveCompanyId(context.company?.id ?? null)
  }, [])

  const clearContext = useCallback(() => {
    applyContext(EMPTY_CONTEXT)
  }, [applyContext])

  const bootstrapSession = useCallback(async () => {
    setBootstrapError('')

    // Design-time bypass: load a full mock session without hitting Laravel.
    if (isUiOnlyMode()) {
      const context = structuredClone(MOCK_AUTH_CONTEXT)
      applyContext(context)
      return context
    }

    try {
      const context = await authApi.fetchMe()
      if (context?.user) {
        applyContext(context)
        return context
      }
    } catch {
    }

    try {
      await authApi.login(DEMO_CREDENTIALS)
      const context = await authApi.fetchMe()
      if (!context?.user) {
        throw new Error('Session not established')
      }
      applyContext(context)
      return context
    } catch {
      clearContext()
      setBootstrapError('Unable to start the application session. Ensure the API is running on port 8000.')
      return null
    }
  }, [applyContext, clearContext])

  const refresh = useCallback(async (companyId) => {
    const context = await authApi.fetchMe(companyId)
    applyContext(context)
    return context
  }, [applyContext])

  useEffect(() => {
    let cancelled = false

    bootstrapSession()
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    const onUnauthorized = () => {
      bootstrapSession()
    }

    window.addEventListener('auth:unauthorized', onUnauthorized)

    return () => {
      cancelled = true
      window.removeEventListener('auth:unauthorized', onUnauthorized)
    }
  }, [bootstrapSession])

  const login = useCallback(async (credentials) => {
    const context = await authApi.login(credentials)
    applyContext(context)
    setBootstrapError('')
    return context
  }, [applyContext])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
    }

    const context = await bootstrapSession()
    return context
  }, [bootstrapSession])

  const hasPermission = useCallback(
    (permission) => permissions.includes(permission),
    [permissions],
  )

  const retryBootstrap = useCallback(async () => {
    setLoading(true)
    await bootstrapSession()
    setLoading(false)
  }, [bootstrapSession])

  const value = useMemo(
    () => ({
      user,
      company,
      companies,
      roles,
      permissions,
      loading,
      bootstrapError,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refresh,
      hasPermission,
      retryBootstrap,
    }),
    [
      user,
      company,
      companies,
      roles,
      permissions,
      loading,
      bootstrapError,
      login,
      logout,
      refresh,
      hasPermission,
      retryBootstrap,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
