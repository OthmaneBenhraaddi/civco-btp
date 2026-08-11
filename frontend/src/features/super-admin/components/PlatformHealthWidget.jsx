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
    <section className={`${BENTO_CARD_CLASS} bg-[#121316] p-6`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">{t('superAdmin.health.title')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('superAdmin.health.subtitle')}</p>
        </div>
        <span className={[
          'rounded-full px-3 py-1 text-xs font-medium',
          operational ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20' : 'bg-amber-500/10 text-amber-300',
        ].join(' ')}>
          {operational ? t('superAdmin.health.allClear') : t('superAdmin.stats.degraded')}
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {HEALTH_ITEMS.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0a0b0d]/50 px-4 py-3"
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
