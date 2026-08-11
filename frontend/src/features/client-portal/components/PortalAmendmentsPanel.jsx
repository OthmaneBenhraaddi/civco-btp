import { useCallback, useEffect, useState } from 'react'
import * as clientPortalApi from '../../../api/clientPortal'
import { useTranslation } from '../../../i18n/LanguageContext'
import { BENTO_CARD_CLASS } from '../../../theme/designTokens'
import { extractErrorMessage, unwrapResource } from '../../../utils/apiHelpers'
import { formatMoney } from '../../../utils/currency'

const STATUS_CLASS = {
  pending_client: 'bg-amber-500/15 text-amber-300',
  validated: 'bg-emerald-500/15 text-emerald-300',
  refused: 'bg-rose-500/15 text-rose-300',
}

export default function PortalAmendmentsPanel({ projectId, onChanged }) {
  const { t, locale } = useTranslation()
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
    } catch (err) {
      setError(extractErrorMessage(err, t('amendments.statusError')))
    } finally {
      setBusyId(null)
    }
  }

  const pendingCount = amendments.filter((item) => item.status === 'pending_client').length

  return (
    <section className={`${BENTO_CARD_CLASS} p-6`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('clientPortal.amendmentsTitle')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('clientPortal.amendmentsSubtitle')}</p>
        </div>
        {pendingCount > 0 ? (
          <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">
            {t('clientPortal.amendmentsPending', { count: pendingCount })}
          </span>
        ) : null}
      </div>

      {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : amendments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.08] bg-[#121316] px-4 py-6 text-sm text-slate-500">
          {t('clientPortal.amendmentsEmpty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {amendments.map((amendment) => (
            <li
              key={amendment.id}
              className="rounded-xl border border-white/[0.06] bg-[#121316] px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-white">{amendment.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t(`amendments.types.${amendment.type}`)}
                    {amendment.amount_change
                      ? ` · ${formatMoney(amendment.amount_change, locale)}`
                      : ''}
                    {amendment.duration_change_days
                      ? ` · ${t('amendments.daysPlus', { days: amendment.duration_change_days })}`
                      : ''}
                  </p>
                  {amendment.description ? (
                    <p className="mt-1 text-sm text-slate-400">{amendment.description}</p>
                  ) : null}
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[amendment.status] ?? 'bg-slate-500/15 text-slate-300'}`}>
                  {t(`amendments.statuses.${amendment.status}`)}
                </span>
              </div>

              {amendment.status === 'pending_client' ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === amendment.id}
                    className="inline-flex rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                    onClick={() => respond(amendment, 'validated')}
                  >
                    {t('clientPortal.acceptAmendment')}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === amendment.id}
                    className="inline-flex rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/25 disabled:opacity-50"
                    onClick={() => respond(amendment, 'refused')}
                  >
                    {t('clientPortal.refuseAmendment')}
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
