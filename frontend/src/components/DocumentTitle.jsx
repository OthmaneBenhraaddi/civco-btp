import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import { isPlatformSuperAdmin } from '../utils/authIdentity'

/**
 * Keeps document.title in sync with auth + active entity (tenant/company).
 */
export default function DocumentTitle() {
  const { t } = useTranslation()
  const { loading, isAuthenticated, tenant, company, user } = useAuth()
  const appName = t('layout.appName')

  useEffect(() => {
    if (loading) {
      return
    }

    if (!isAuthenticated) {
      document.title = `Home | ${appName}`
      return
    }

    const entityName =
      tenant?.name?.trim()
      || company?.name?.trim()
      || (isPlatformSuperAdmin(user) ? t('layout.profileRoleSuperAdmin') : null)

    document.title = entityName ? `${entityName} | ${appName}` : appName
  }, [appName, company?.name, isAuthenticated, loading, t, tenant?.name, user])

  return null
}
