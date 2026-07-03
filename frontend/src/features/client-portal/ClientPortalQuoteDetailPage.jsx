import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CommercialPrintSheet from '../../components/print/CommercialPrintSheet'
import * as clientPortalQuotesApi from '../../api/clientPortalQuotes'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { resolveNavPath } from '../../routes/routeAccess'
import { BENTO_CARD_CLASS, PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { SignatureCanvasPadSubmit } from './components/SignatureCanvasPad'

export default function ClientPortalQuoteDetailPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()

  const [quote, setQuote] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signatureData, setSignatureData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const loadQuote = useCallback(async () => {
    if (!id) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const [quoteData, previewData] = await Promise.all([
        clientPortalQuotesApi.fetchClientQuote(id),
        clientPortalQuotesApi.fetchClientQuotePreview(id),
      ])
      setQuote(quoteData)
      setPreview(previewData)
    } catch (err) {
      setError(extractErrorMessage(err, t('clientPortal.quotes.loadError')))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    loadQuote()
  }, [loadQuote])

  async function handleAccept() {
    if (!signatureData || !id) {
      setError(t('clientPortal.quotes.signatureRequired'))
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const updated = await clientPortalQuotesApi.acceptClientQuote(id, signatureData)
      const previewData = await clientPortalQuotesApi.fetchClientQuotePreview(id)
      setQuote(updated)
      setPreview(previewData)
      setSuccess(t('clientPortal.quotes.acceptSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('clientPortal.quotes.acceptError')))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{t('common.loading')}</p>
  }

  if (!quote) {
    return (
      <div className="list-page space-y-4">
        <p className="text-sm text-rose-300">{error || t('clientPortal.quotes.notFound')}</p>
        <Link
          to={resolveNavPath('/portal/quotes', user)}
          className="text-sm text-indigo-300 hover:text-indigo-200"
        >
          {t('clientPortal.quotes.backToList')}
        </Link>
      </div>
    )
  }

  const canAccept = quote.can_accept
  const lines = quote.lines ?? []

  return (
    <div className="list-page space-y-6">
      <header className="page-header">
        <div>
          <Link
            to={resolveNavPath('/portal/quotes', user)}
            className="mb-2 inline-block text-xs text-slate-500 hover:text-slate-300"
          >
            ← {t('clientPortal.quotes.backToList')}
          </Link>
          <h1 className={PAGE_TITLE_CLASS}>{quote.reference}</h1>
          <p className={PAGE_SUBTITLE_CLASS}>
            {canAccept
              ? t('clientPortal.quotes.reviewPending')
              : t('clientPortal.quotes.reviewAccepted')}
          </p>
        </div>
        {canAccept ? (
          <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-200">
            {t('clientPortal.quotes.statusPending')}
          </span>
        ) : (
          <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
            {t('clientPortal.quotes.statusAccepted')}
          </span>
        )}
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {success}
        </div>
      ) : null}

      <section className={`${BENTO_CARD_CLASS} overflow-hidden p-4 sm:p-6`}>
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <CommercialPrintSheet
            documentType="quote"
            reference={quote.reference}
            clientName={quote.client?.name}
            projectTitle={quote.project?.title}
            issuedAt={quote.issued_at}
            secondaryDate={quote.valid_until}
            secondaryDateLabel={t('quotes.validUntil')}
            notes={quote.notes}
            compiledFooter={preview?.compiled_footer ?? ''}
            lines={lines}
            totalHt={quote.total_ht}
            totalTax={quote.total_tax}
            totalTtc={quote.total_ttc}
            tenantLogoUrl={preview?.tenant?.logo_url}
            tenantName={preview?.tenant?.name}
            signature={preview?.signature}
          />
        </div>
      </section>

      {canAccept ? (
        <section className={`${BENTO_CARD_CLASS} p-6`}>
          <h2 className="text-lg font-semibold text-white">{t('clientPortal.quotes.signTitle')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('clientPortal.quotes.signHint')}</p>
          <div className="mt-6 max-w-2xl">
            <SignatureCanvasPadSubmit
              disabled={submitting}
              onChange={setSignatureData}
              clearLabel={t('clientPortal.quotes.clearSignature')}
              submitLabel={t('clientPortal.quotes.acceptAndSign')}
              submitting={submitting}
              onSubmit={handleAccept}
              heightClass="h-64"
            />
          </div>
        </section>
      ) : quote.client_signed_at ? (
        <p className="text-sm text-emerald-400">
          {t('clientPortal.quotes.alreadySigned', {
            date: new Date(quote.client_signed_at).toLocaleString(),
          })}
        </p>
      ) : null}
    </div>
  )
}
