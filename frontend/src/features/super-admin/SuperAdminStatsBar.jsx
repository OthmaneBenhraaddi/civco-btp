import KpiCard from '../../components/KpiCard'
import { BENTO_CARD_CLASS } from '../../theme/designTokens'
import { useTranslation } from '../../i18n/LanguageContext'

export default function SuperAdminStatsBar({ stats, loading }) {
  const { t } = useTranslation()

  if (loading && !stats) {
    return (
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((key) => (
          <div key={key} className={`${BENTO_CARD_CLASS} h-24 animate-pulse p-5`} />
        ))}
      </section>
    )
  }

  const activeTenants = stats?.active_tenants ?? 0
  const totalUsers = stats?.total_users ?? 0
  const operational = stats?.system_status === 'operational'

  return (
    <section className="mb-6 grid gap-4 sm:grid-cols-3">
      <KpiCard
        label={t('superAdmin.stats.totalEntities')}
        value={activeTenants}
        hint={t('superAdmin.stats.activeOnly')}
        variant="operational"
      />
      <KpiCard
        label={t('superAdmin.stats.teamMembers')}
        value={totalUsers}
        hint={t('superAdmin.stats.allTenants')}
        variant="progress"
      />
      <article className={`relative min-w-0 overflow-hidden ${BENTO_CARD_CLASS} p-5`}>
        <span className="absolute right-5 top-5 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
        <p className="pr-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {t('superAdmin.stats.systemStatus')}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {operational ? t('superAdmin.stats.operational') : t('superAdmin.stats.degraded')}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {operational ? '🟢' : '🟠'} {t('superAdmin.stats.systemHint')}
        </p>
      </article>
    </section>
  )
}
