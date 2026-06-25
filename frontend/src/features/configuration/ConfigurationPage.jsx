import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../i18n/LanguageContext'
import BadgeSettingsPanel from '../clients/BadgeSettingsPanel'
import ColorSettingsPanel from '../clients/ColorSettingsPanel'
import LotSettingsPanel from '../clients/LotSettingsPanel'
import RolesSettingsPanel from '../roles/RolesSettingsPanel'
import DocumentTypeSettingsPanel from './DocumentTypeSettingsPanel'

const TABS = [
  { id: 'badges', labelKey: 'configuration.tabBadges' },
  { id: 'lots', labelKey: 'configuration.tabLots' },
  { id: 'documents', labelKey: 'configuration.tabDocuments' },
  { id: 'colors', labelKey: 'configuration.tabColors' },
  { id: 'roles', labelKey: 'configuration.tabRoles' },
]

const VALID_TAB_IDS = new Set(TABS.map((tab) => tab.id))

export default function ConfigurationPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(
    VALID_TAB_IDS.has(tabFromUrl) ? tabFromUrl : 'lots',
  )

  useEffect(() => {
    if (VALID_TAB_IDS.has(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl, activeTab])

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
        {TABS.map((tab) => (
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
        {activeTab === 'badges' ? (
          <BadgeSettingsPanel />
        ) : activeTab === 'lots' ? (
          <LotSettingsPanel />
        ) : activeTab === 'documents' ? (
          <DocumentTypeSettingsPanel />
        ) : activeTab === 'roles' ? (
          <RolesSettingsPanel />
        ) : (
          <ColorSettingsPanel />
        )}
      </div>
    </div>
  )
}
