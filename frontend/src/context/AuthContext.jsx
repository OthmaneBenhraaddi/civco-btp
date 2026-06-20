import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { setActiveCompanyId } from '../api/client'

const AuthContext = createContext(null)

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

  const loadContext = useCallback(async () => {
    setBootstrapError('')

    try {
      const context = await authApi.fetchMe()
      if (context?.user) {
        applyContext(context)
        return context
      }

      throw new Error('Demo context unavailable')
    } catch {
      setUser(null)
      setCompany(null)
      setCompanies([])
      setRoles([])
      setPermissions([])
      setActiveCompanyId(null)
      setBootstrapError('Unable to reach the API. Start the backend on port 8000.')
      return null
    }
  }, [applyContext])

  const refresh = useCallback(async (companyId) => {
    const context = await authApi.fetchMe(companyId)
    applyContext(context)
    return context
  }, [applyContext])

  useEffect(() => {
    let cancelled = false

    loadContext().finally(() => {
      if (!cancelled) {
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [loadContext])

  const hasPermission = useCallback(
    (permission) => permissions.includes(permission),
    [permissions],
  )

  const retryBootstrap = useCallback(async () => {
    setLoading(true)
    await loadContext()
    setLoading(false)
  }, [loadContext])

  const value = useMemo(
    () => ({
      user,
      company,
      companies,
      roles,
      permissions,
      loading,
      bootstrapError,
      isReady: Boolean(user),
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
