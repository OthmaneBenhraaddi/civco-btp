import { useCallback, useEffect, useState } from 'react'
import * as demoApi from '../../api/demo'
import CutFrame from '../../components/prodigy/CutFrame'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import SuperAdminPageHeader from './components/SuperAdminPageHeader'
import { useTranslation } from '../../i18n/LanguageContext'
import { FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

const STATUS_OPTIONS = [
  { value: '', labelKey: 'demo.requests.filterAll' },
  { value: 'pending', labelKey: 'demo.requests.statusPending' },
  { value: 'contacted', labelKey: 'demo.requests.statusContacted' },
  { value: 'closed', labelKey: 'demo.requests.statusClosed' },
]

const STATUS_TONES = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  contacted: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  closed: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
}

export default function SuperAdminDemoRequestsPage() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await demoApi.fetchDemoRequests({
        per_page: 50,
        status: status || undefined,
        search: appliedSearch.trim() || undefined,
      })
      setRequests(response?.data ?? response ?? [])
    } catch (err) {
      setError(extractErrorMessage(err, t('demo.requests.loadError')))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, status, t])

  useEffect(() => {
    load()
  }, [load])

  function handleSearchSubmit(event) {
    event.preventDefault()
    setAppliedSearch(search.trim())
  }

  async function handleStatusChange(id, nextStatus) {
    setUpdatingId(id)
    setError('')
    try {
      const updated = await demoApi.updateDemoRequestStatus(id, nextStatus)
      const row = updated?.data ?? updated
      setRequests((current) => current.map((item) => (
        item.id === id ? { ...item, ...row } : item
      )))
    } catch (err) {
      setError(extractErrorMessage(err, t('demo.requests.updateError')))
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('demo.requests.deleteConfirm'))) {
      return
    }

    setError('')
    try {
      await demoApi.deleteDemoRequest(id)
      setRequests((current) => current.filter((item) => item.id !== id))
    } catch (err) {
      setError(extractErrorMessage(err, t('demo.requests.deleteError')))
    }
  }

  return (
    <div className="list-page mx-auto max-w-[1100px] space-y-6">
      <SuperAdminPageHeader
        title={t('demo.requests.title')}
        subtitle={t('demo.requests.subtitle')}
      />

      <CutFrame size="md" innerClassName="bg-[#0e131f] p-4 sm:p-5">
        <form onSubmit={handleSearchSubmit} className="grid gap-3 sm:grid-cols-[1fr_220px_auto]">
          <label className="block min-w-0">
            <span className={LABEL_CLASS}>{t('demo.requests.search')}</span>
            <input
              className={FIELD_CLASS}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('demo.requests.searchPlaceholder')}
            />
          </label>
          <label className="block">
            <span className={LABEL_CLASS}>{t('demo.requests.status')}</span>
            <CutSelect
              className="w-full"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS.map((item) => ({
                value: item.value,
                label: t(item.labelKey),
              }))}
            />
          </label>
          <div className="flex items-end gap-2">
            <NeonButton type="submit" size="sm" variant="ghost">
              {t('demo.requests.refresh')}
            </NeonButton>
          </div>
        </form>
      </CutFrame>

      {error ? (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
      ) : null}

      <CutFrame size="lg" className="block" innerClassName="bg-[#0e131f] p-0 overflow-hidden">
        <div className="border-b border-white/[0.05] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {t('demo.requests.listTitle')}
        </div>

        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-400">{t('common.loading')}</p>
        ) : requests.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400">{t('demo.requests.empty')}</p>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {requests.map((item) => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-white">{item.full_name}</p>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_TONES[item.status] ?? STATUS_TONES.pending}`}>
                        {t(`demo.requests.status${capitalize(item.status)}`)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{item.company_name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      <a href={`mailto:${item.email}`} className="text-[var(--pg-accent)] hover:underline">
                        {item.email}
                      </a>
                      {item.phone ? ` · ${item.phone}` : ''}
                      {item.created_at
                        ? ` · ${new Date(item.created_at).toLocaleString('fr-FR')}`
                        : ''}
                    </p>
                    {item.message ? (
                      <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm text-slate-300">
                        {item.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <CutSelect
                      className="min-w-[9rem]"
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(value) => handleStatusChange(item.id, value)}
                      options={[
                        { value: 'pending', label: t('demo.requests.statusPending') },
                        { value: 'contacted', label: t('demo.requests.statusContacted') },
                        { value: 'closed', label: t('demo.requests.statusClosed') },
                      ]}
                    />
                    <NeonButton
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      {t('common.delete')}
                    </NeonButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CutFrame>
    </div>
  )
}

function capitalize(value) {
  if (!value) {
    return ''
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}
