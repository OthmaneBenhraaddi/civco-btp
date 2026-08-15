import { useCallback, useEffect, useState } from 'react'
import * as clientPortalApi from '../../../api/clientPortal'
import NeonButton from '../../../components/prodigy/NeonButton'
import { useTranslation } from '../../../i18n/LanguageContext'
import { useActionToast } from '../../../hooks/useActionToast'
import { BENTO_CARD_CLASS, PG_BADGE, PG_BADGE_TONES } from '../../../theme/designTokens'
import { extractErrorMessage, unwrapResource } from '../../../utils/apiHelpers'
import { formatMoney } from '../../../utils/currency'

const STATUS_CLASS = {
  pending_client: PG_BADGE_TONES.pending,
  validated: PG_BADGE_TONES.success,
  refused: PG_BADGE_TONES.danger,
}

export default function PortalAmendmentsPanel({ projectId, onChanged }) {
  const { t } = useTranslation()
  const { toastSuccess, toastError } = useActionToast()
  const [amendments, setAmendments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    if (!projectId) {
      setAmendments([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await clientPortalApi.fetchProjectAmendments(projectId)
      setAmendments(unwrapResource(data))
    } catch (err) {
      setError(extractErrorMessage(err, t('amendments.loadError')))
    } finally {
      setLoading(false)
    }
  }, [projectId, t])

  useEffect(() => {
    load()
  }, [load])

  async function respond(amendment, status) {
    setBusyId(amendment.id)
    setError('')

    try {
      await clientPortalApi.respondToAmendment(amendment.id, status)
      await load()
      await onChanged?.()
      toastSuccess(t('toast.messages.amendmentResponded'))
    } catch (err) {
      const message = extractErrorMessage(err, t('amendments.statusError'))
      setError(message)
      toastError(message)
    } finally {
      setBusyId(null)
    }
  }

  const pendingCount = amendments.filter((item) => item.status === 'pending_client').length

  return (
    <section className={`${BENTO_CARD_CLASS} p-6`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-white">
            {t('clientPortal.amendmentsTitle')}
          </h2>
          <p className="mt-1 text-sm text-[var(--pg-text-muted)]">{t('clientPortal.amendmentsSubtitle')}</p>
        </div>
        {pendingCount > 0 ? (
          <span className={`${PG_BADGE} ${PG_BADGE_TONES.pending}`}>
            {t('clientPortal.amendmentsPending', { count: pendingCount })}
          </span>
        ) : null}
      </div>

      {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-[var(--pg-text-dim)]">{t('common.loading')}</p>
      ) : amendments.length === 0 ? (
        <p className="pg-inner-tile px-4 py-6 text-sm text-[var(--pg-text-dim)]">
          {t('clientPortal.amendmentsEmpty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {amendments.map((amendment) => (
            <li key={amendment.id} className="pg-inner-tile px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-white">{amendment.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--pg-text-dim)]">
                    {t(`amendments.types.${amendment.type}`)}
                    {amendment.amount_change
                      ? ` · ${formatMoney(amendment.amount_change)}`
                      : ''}
                    {amendment.duration_change_days
                      ? ` · ${t('amendments.daysPlus', { days: amendment.duration_change_days })}`
                      : ''}
                  </p>
                  {amendment.description ? (
                    <p className="mt-1 text-sm text-[var(--pg-text-muted)]">{amendment.description}</p>
                  ) : null}
                </div>
                <span className={`${PG_BADGE} ${STATUS_CLASS[amendment.status] ?? PG_BADGE_TONES.draft}`}>
                  {t(`amendments.statuses.${amendment.status}`)}
                </span>
              </div>

              {amendment.status === 'pending_client' ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <NeonButton
                    type="button"
                    size="sm"
                    disabled={busyId === amendment.id}
                    onClick={() => respond(amendment, 'validated')}
                  >
                    {t('clientPortal.acceptAmendment')}
                  </NeonButton>
                  <NeonButton
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={busyId === amendment.id}
                    onClick={() => respond(amendment, 'refused')}
                  >
                    {t('clientPortal.refuseAmendment')}
                  </NeonButton>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
