import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isClientUser as checkIsClientUser } from '../routes/routeAccess'
import * as authApi from '../api/auth'
import { setActiveCompanyId, setAuthBootstrapComplete } from '../api/client'
import { clearDevTenantSlug, getDevTenantSlug, setDevTenantSlug } from '../utils/tenantDevContext'
import { isPlatformSuperAdmin, sessionMatchesTenantContext } from '../utils/authIdentity'
import { userHasPermission } from '../utils/permissionResolver'

const AuthContext = createContext(null)

const EMPTY_CONTEXT = {
  user: null,
  company: null,
  companies: [],
  roles: [],
  permissions: [],
  tenant: null,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [companies, setCompanies] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const bootstrappingRef = useRef(false)

  const applyContext = useCallback((context) => {
    const activeTenantSlug = getDevTenantSlug()

    if (
      context?.user
      && activeTenantSlug
      && !sessionMatchesTenantContext(context.user, context.tenant, activeTenantSlug)
    ) {
      setUser(null)
      setCompany(null)
      setCompanies([])
      setRoles([])
      setPermissions([])
      setTenant(null)
      setActiveCompanyId(null)
      return false
    }

    setUser(context.user)
    setCompany(context.company)
    setCompanies(context.companies ?? [])
    setRoles(context.roles ?? [])
    setPermissions(context.permissions ?? [])
    setTenant(context.tenant ?? null)
    setActiveCompanyId(context.company?.id ?? null)

    if (isPlatformSuperAdmin(context.user)) {
      clearDevTenantSlug()
    } else if (context.tenant?.subdomain) {
      setDevTenantSlug(context.tenant.subdomain)
    }

    return true
  }, [])

  const clearContext = useCallback(() => {
    applyContext(EMPTY_CONTEXT)
    setActiveCompanyId(null)
    clearDevTenantSlug()
  }, [applyContext])

  const bootstrapSession = useCallback(async () => {
    if (bootstrappingRef.current) {
      return null
    }

    bootstrappingRef.current = true

    try {
      const context = await authApi.fetchMe()
      if (context?.user && applyContext(context)) {
        return context
      }
    } catch {
    } finally {
      bootstrappingRef.current = false
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
    (permission) => userHasPermission(permissions, permission),
    [permissions],
  )

  const isAdmin = user?.role === 'admin'
  const isSuperAdmin = isPlatformSuperAdmin(user) || user?.is_super_admin === true
  const isClientPortalUser = checkIsClientUser(user, roles)

  const value = useMemo(
    () => ({
      user,
      company,
      companies,
      roles,
      permissions,
      tenant,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refresh,
      hasPermission,
      isAdmin,
      isSuperAdmin,
      isClientPortalUser,
    }),
    [
      user,
      company,
      companies,
      roles,
      permissions,
      tenant,
      loading,
      login,
      logout,
      refresh,
      hasPermission,
      isAdmin,
      isSuperAdmin,
      isClientPortalUser,
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
