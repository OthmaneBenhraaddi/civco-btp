import { useCallback, useEffect, useState } from 'react'
import * as superAdminApi from '../../api/superAdmin'
import { useTranslation } from '../../i18n/LanguageContext'
import SuperAdminPageHeader from './components/SuperAdminPageHeader'
import SuperAdminStatsBar from './SuperAdminStatsBar'
import PlatformHealthWidget from './components/PlatformHealthWidget'

export default function SuperAdminOverviewPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    setLoading(true)

    try {
      const data = await superAdminApi.fetchSuperAdminStats()
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return (
    <div className="list-page mx-auto max-w-[1200px]">
      <SuperAdminPageHeader
        title={t('superAdmin.nav.overview')}
        subtitle={t('superAdmin.overview.subtitle')}
      />

      <SuperAdminStatsBar stats={stats} loading={loading} />

      <PlatformHealthWidget stats={stats} />
    </div>
  )
}
