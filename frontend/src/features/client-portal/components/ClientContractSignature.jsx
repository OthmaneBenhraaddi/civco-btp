import { useCallback, useEffect, useState } from 'react'
import * as clientPortalApi from '../../../api/clientPortal'
import { useTranslation } from '../../../i18n/LanguageContext'
import { useActionToast } from '../../../hooks/useActionToast'
import { BENTO_CARD_CLASS, PAGE_SUBTITLE_CLASS, PAGE_TITLE_CLASS } from '../../../theme/designTokens'
import { extractErrorMessage } from '../../../utils/apiHelpers'
import { SignatureCanvasPadSubmit } from './SignatureCanvasPad'

const STATUS_LABELS = {
  draft: 'contracts.statusDraft',
  signed_by_client: 'contracts.statusSignedByClient',
  fully_executed: 'contracts.statusFullyExecuted',
}

export default function ClientContractSignature({ projectId }) {
  const { t } = useTranslation()
  const { toastSuccess, toastError } = useActionToast()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signatureData, setSignatureData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const loadContract = useCallback(async () => {
    if (!projectId) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await clientPortalApi.fetchProjectContract(projectId)
      setContract(data)
    } catch (err) {
      if (err.response?.status === 404) {
        setContract(null)
      } else {
        setError(extractErrorMessage(err, t('contracts.loadError')))
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, t])

  useEffect(() => {
    loadContract()
  }, [loadContract])

  async function handleSign() {
    if (!signatureData || !projectId) {
      setError(t('contracts.signatureRequired'))
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const updated = await clientPortalApi.signProjectContract(projectId, signatureData)
      setContract(updated)
      setSuccess(t('contracts.signSuccess'))
      toastSuccess(t('toast.messages.contractSigned'))
    } catch (err) {
      const message = extractErrorMessage(err, t('contracts.signError'))
      setError(message)
      toastError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{t('common.loading')}</p>
  }

  if (!contract) {
    return (
      <section className={`${BENTO_CARD_CLASS} p-6`}>
        <h2 className="text-lg font-semibold text-white">{t('contracts.clientTitle')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('contracts.noContract')}</p>
      </section>
    )
  }

  const canSign = contract.status === 'draft' && !contract.has_client_signature
  const statusKey = STATUS_LABELS[contract.status] ?? 'contracts.statusDraft'

  return (
    <section className={`${BENTO_CARD_CLASS} p-6`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={PAGE_TITLE_CLASS}>{t('contracts.clientTitle')}</h2>
          <p className={PAGE_SUBTITLE_CLASS}>{contract.title}</p>
        </div>
        <span className="pg-inner-tile px-3 py-1.5 text-xs font-medium text-[var(--pg-accent)]">
          {t(statusKey)}
        </span>
      </header>

      {error ? (
        <p className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      ) : null}

      <div
        className="contract-document-preview mb-6 max-h-[480px] overflow-y-auto rounded-xl border border-white/[0.06] bg-white p-6 text-sm leading-relaxed text-slate-800"
        dangerouslySetInnerHTML={{ __html: contract.content }}
      />

      {canSign ? (
        <div className="border-t border-white/[0.06] pt-6">
          <h3 className="mb-2 text-sm font-semibold text-white">{t('contracts.signHere')}</h3>
          <p className="mb-4 text-xs text-slate-500">{t('contracts.signHint')}</p>
          <SignatureCanvasPadSubmit
            disabled={submitting}
            onChange={setSignatureData}
            clearLabel={t('contracts.clearSignature')}
            submitLabel={t('contracts.submitSignature')}
            submitting={submitting}
            onSubmit={handleSign}
          />
        </div>
      ) : contract.client_signed_at ? (
        <p className="text-sm text-emerald-400">
          {t('contracts.alreadySigned', { date: new Date(contract.client_signed_at).toLocaleString() })}
        </p>
      ) : null}
    </section>
  )
}
