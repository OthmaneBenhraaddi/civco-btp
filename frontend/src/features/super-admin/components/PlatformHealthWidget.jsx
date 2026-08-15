import { BENTO_CARD_CLASS } from '../../../theme/designTokens'
import { useTranslation } from '../../../i18n/LanguageContext'

const HEALTH_ITEMS = [
  { key: 'api', status: 'ok' },
  { key: 'database', status: 'ok' },
  { key: 'storage', status: 'ok' },
  { key: 'tenants', status: 'ok' },
]

export default function PlatformHealthWidget({ stats }) {
  const { t } = useTranslation()
  const operational = stats?.system_status === 'operational'

  return (
    <section className={`${BENTO_CARD_CLASS} p-6`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">{t('superAdmin.health.title')}</h2>
          <p className="mt-1 text-sm text-[var(--pg-text-muted)]">{t('superAdmin.health.subtitle')}</p>
        </div>
        <span className={[
          'inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em]',
          operational
            ? 'border-[rgba(34,197,94,0.4)] bg-[rgba(34,197,94,0.12)] text-[#4ade80]'
            : 'border-[rgba(251,191,36,0.4)] bg-[rgba(251,191,36,0.1)] text-amber-300',
        ].join(' ')}>
          {operational ? t('superAdmin.health.allClear') : t('superAdmin.stats.degraded')}
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {HEALTH_ITEMS.map((item) => (
          <li
            key={item.key}
            className="pg-inner-tile flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm text-slate-300">{t(`superAdmin.health.${item.key}`)}</span>
            <span className="text-xs font-medium text-emerald-400">
              {t('superAdmin.health.ok')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
