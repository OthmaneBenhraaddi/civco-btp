import { formatRelativeTime } from '../../../utils/formatRelativeTime'
import { BENTO_CARD_CLASS } from '../../../theme/designTokens'
import { useTranslation } from '../../../i18n/LanguageContext'

export default function ChantierLiveFeed({ media, loading }) {
  const { t } = useTranslation()

  return (
    <section className={`${BENTO_CARD_CLASS} p-6`}>
      <header className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">{t('clientPortal.liveFeedTitle')}</h2>
        <p className="mt-1 text-sm text-[var(--pg-text-muted)]">{t('clientPortal.liveFeedSubtitle')}</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : media.length === 0 ? (
        <div className="pg-inner-tile px-6 py-12 text-center">
          <p className="text-sm text-slate-500">{t('clientPortal.noMedia')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {media.map((item) => (
            <article
              key={item.id}
              className="pg-inner-tile group overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#0b0f17]">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="space-y-1 p-4">
                <h3 className="text-sm font-medium text-white">{item.title}</h3>
                <p className="text-xs text-slate-500">
                  {formatRelativeTime(item.created_at)}
                  {item.uploaded_by?.full_name
                    ? ` · ${item.uploaded_by.full_name}`
                    : ''}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
