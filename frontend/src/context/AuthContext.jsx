import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { setActiveCompanyId, setAuthBootstrapComplete } from '../api/client'

const AuthContext = createContext(null)

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
  const bootstrappingRef = useRef(false)

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
    setActiveCompanyId(null)
  }, [applyContext])

  const bootstrapSession = useCallback(async () => {
    if (bootstrappingRef.current) {
      return null
    }

    bootstrappingRef.current = true

    try {
      const context = await authApi.fetchMe()
      if (context?.user) {
        applyContext(context)
        return context
      }
    } catch {
    }

    clearContext()
    return null
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
          setAuthBootstrapComplete(true)
        }
      })

    const onUnauthorized = () => {
      if (!bootstrappingRef.current) {
        clearContext()
      }
    }

    window.addEventListener('auth:unauthorized', onUnauthorized)

    return () => {
      cancelled = true
      window.removeEventListener('auth:unauthorized', onUnauthorized)
    }
  }, [bootstrapSession, clearContext])

  const login = useCallback(async (credentials) => {
    const context = await authApi.login(credentials)
    applyContext(context)
    return context
  }, [applyContext])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
    }

    clearContext()
  }, [clearContext])

  const hasPermission = useCallback(
    (permission) => permissions.includes(permission),
    [permissions],
  )

  const isAdmin = user?.role === 'admin'

  const value = useMemo(
    () => ({
      user,
      company,
      companies,
      roles,
      permissions,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refresh,
      hasPermission,
      isAdmin,
    }),
    [
      user,
      company,
      companies,
      roles,
      permissions,
      loading,
      login,
      logout,
      refresh,
      hasPermission,
      isAdmin,
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
