import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { prefetchRoleSettings } from '../../api/roles'
import { useTranslation } from '../../i18n/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { isPlatformSuperAdmin } from '../../utils/authIdentity'
import BadgeSettingsPanel from '../clients/BadgeSettingsPanel'
import ColorSettingsPanel from '../clients/ColorSettingsPanel'
import LotSettingsPanel from '../clients/LotSettingsPanel'
import RolesSettingsPanel from '../roles/RolesSettingsPanel'
import DocumentTypeSettingsPanel from './DocumentTypeSettingsPanel'
import DocumentControlsSettingsPanel from './DocumentControlsSettingsPanel'
import DocumentTemplatesSettingsPanel from './DocumentTemplatesSettingsPanel'
import ContractTemplateSettingsPanel from './ContractTemplateSettingsPanel'
import EntityLogoSettingsPanel from './EntityLogoSettingsPanel'
import HiddenStealthSettings from './HiddenStealthSettings'

const TABS = [
  { id: 'entity', labelKey: 'configuration.tabEntity', tenantAdminOnly: true },
  { id: 'badges', labelKey: 'configuration.tabBadges' },
  { id: 'lots', labelKey: 'configuration.tabLots' },
  { id: 'documents', labelKey: 'configuration.tabDocuments' },
  { id: 'document-templates', labelKey: 'configuration.tabDocumentTemplates', tenantAdminOnly: true },
  { id: 'document-controls', labelKey: 'configuration.tabDocumentControls', tenantAdminOnly: true },
  { id: 'colors', labelKey: 'configuration.tabColors' },
  { id: 'contracts', labelKey: 'configuration.tabContracts', tenantAdminOnly: true },
  { id: 'roles', labelKey: 'configuration.tabRoles', tenantAdminOnly: true },
]

function resolveDefaultTab(visibleTabs, tabFromUrl) {
  const validIds = new Set(visibleTabs.map((tab) => tab.id))

  if (tabFromUrl && validIds.has(tabFromUrl)) {
    return tabFromUrl
  }

  return visibleTabs[0]?.id ?? 'badges'
}

export default function ConfigurationPage() {
  const { t } = useTranslation()
  const { isAdmin, user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')

  const canManageTenantSettings = isAdmin && Boolean(user?.tenant_id) && !isPlatformSuperAdmin(user)

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !tab.tenantAdminOnly || canManageTenantSettings),
    [canManageTenantSettings],
  )

  const [activeTab, setActiveTab] = useState(() => resolveDefaultTab(visibleTabs, tabFromUrl))

  useEffect(() => {
    const nextTab = resolveDefaultTab(visibleTabs, tabFromUrl)

    if (nextTab !== activeTab) {
      setActiveTab(nextTab)
    }
  }, [tabFromUrl, visibleTabs, activeTab])

  useEffect(() => {
    if (canManageTenantSettings) {
      prefetchRoleSettings()
    }
  }, [canManageTenantSettings])

  function selectTab(tabId) {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId }, { replace: true })
  }

  return (
    <div className="configuration-page list-page">
      <header className="page-header">
        <div>
          <h1>{t('configuration.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('configuration.subtitle')}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-3">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'filter-select active' : 'filter-select ghost'}
            onClick={() => selectTab(tab.id)}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'entity' ? (
          <>
            <EntityLogoSettingsPanel />
            {canManageTenantSettings ? <HiddenStealthSettings /> : null}
          </>
        ) : activeTab === 'badges' ? (
          <BadgeSettingsPanel />
        ) : activeTab === 'lots' ? (
          <LotSettingsPanel />
        ) : activeTab === 'documents' ? (
          <DocumentTypeSettingsPanel />
        ) : activeTab === 'document-templates' ? (
          <DocumentTemplatesSettingsPanel />
        ) : activeTab === 'document-controls' ? (
          <DocumentControlsSettingsPanel />
        ) : activeTab === 'roles' ? (
          <RolesSettingsPanel />
        ) : activeTab === 'contracts' ? (
          <ContractTemplateSettingsPanel />
        ) : (
          <ColorSettingsPanel />
        )}
      </div>
    </div>
  )
}
