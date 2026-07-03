import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as clientPortalQuotesApi from '../../api/clientPortalQuotes'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { resolveNavPath } from '../../routes/routeAccess'
import { BENTO_CARD_CLASS, PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { formatMoney } from '../../utils/currency'
import StatusBadge from '../../components/StatusBadge'

export default function ClientPortalQuotesPage() {
  const { t, locale } = useTranslation()
  const { user } = useAuth()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadQuotes = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await clientPortalQuotesApi.fetchClientQuotes()
      setQuotes(data)
    } catch (err) {
      setError(extractErrorMessage(err, t('clientPortal.quotes.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  return (
    <div className="list-page space-y-6">
      <header className="page-header">
        <div>
          <h1 className={PAGE_TITLE_CLASS}>{t('clientPortal.quotes.title')}</h1>
          <p className={PAGE_SUBTITLE_CLASS}>{t('clientPortal.quotes.subtitle')}</p>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : quotes.length === 0 ? (
        <section className={`${BENTO_CARD_CLASS} space-y-3 p-8 text-center`}>
          <p className="text-sm text-slate-400">{t('clientPortal.quotes.empty')}</p>
          <p className="text-xs text-slate-500">{t('clientPortal.quotes.emptyHint')}</p>
        </section>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <Link
              key={quote.id}
              to={resolveNavPath(`/portal/quotes/${quote.id}`, user)}
              className={`${BENTO_CARD_CLASS} block p-5 transition-colors hover:bg-white/[0.02]`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{quote.reference}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {quote.project?.title ?? t('clientPortal.quotes.noProject')}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={quote.status === 'sent' ? 'pending' : quote.status} />
                  <p className="mt-2 text-sm font-medium text-indigo-300">
                    {formatMoney(quote.total_ttc, locale)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {quote.can_accept
                  ? t('clientPortal.quotes.actionRequired')
                  : t('clientPortal.quotes.viewSigned')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
