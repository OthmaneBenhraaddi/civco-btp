import { useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import * as superAdminApi from '../../api/superAdmin'
import { extractErrorMessage } from '../../utils/apiHelpers'
import EntityCreationWizard from './EntityCreationWizard'
import SuperAdminPageHeader from './components/SuperAdminPageHeader'
import ProvisionSuccessBanner from './components/ProvisionSuccessBanner'

export default function SuperAdminCreateEntityPage() {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [provisionResult, setProvisionResult] = useState(null)

  async function handleCreateEntity(payload) {
    setSaving(true)
    setError('')
    setProvisionResult(null)

    try {
      const result = await superAdminApi.createTenant(payload)
      setProvisionResult(result)
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.createError')))
      throw err
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="list-page mx-auto max-w-[1200px]">
      <SuperAdminPageHeader
        title={t('superAdmin.nav.create')}
        subtitle={t('superAdmin.create.subtitle')}
      />

      {error ? <p className="error mb-4">{error}</p> : null}

      <ProvisionSuccessBanner result={provisionResult} variant="tenant" />

      <EntityCreationWizard saving={saving} onSubmit={handleCreateEntity} />
    </div>
  )
}
