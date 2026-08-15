import { useCallback, useEffect, useMemo, useState } from 'react'
import * as demoApi from '../../api/demo'
import NeonButton from '../../components/prodigy/NeonButton'
import CutFrame from '../../components/prodigy/CutFrame'
import CutSelect from '../../components/prodigy/CutSelect'
import { useTranslation } from '../../i18n/LanguageContext'
import { extractErrorMessage } from '../../utils/apiHelpers'

const PRESETS = [
  { id: '12h', hours: 12, labelKey: 'demo.presets.12h' },
  { id: '1d', hours: 24, labelKey: 'demo.presets.1d' },
  { id: '2d', hours: 48, labelKey: 'demo.presets.2d' },
  { id: '3d', hours: 72, labelKey: 'demo.presets.3d' },
  { id: 'custom', hours: null, labelKey: 'demo.presets.custom' },
]

export default function SuperAdminDemoCodesPage() {
  const { t } = useTranslation()
  const [preset, setPreset] = useState('1d')
  const [customHours, setCustomHours] = useState('24')
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  const durationHours = useMemo(() => {
    const match = PRESETS.find((item) => item.id === preset)
    if (preset === 'custom') {
      return Math.max(1, Math.min(720, Number(customHours) || 1))
    }
    return match?.hours ?? 24
  }, [preset, customHours])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await demoApi.fetchDemoCodes({ per_page: 50 })
      setCodes(response?.data ?? response ?? [])
    } catch (err) {
      setError(extractErrorMessage(err, t('demo.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(event) {
    event.preventDefault()
    setCreating(true)
    setError('')
    setCreated(null)
    try {
      const code = await demoApi.createDemoCode({
        duration_hours: durationHours,
        preset,
      })
      setCreated(code?.data ?? code)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err, t('demo.createError')))
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id) {
    if (!window.confirm(t('demo.revokeConfirm'))) return
    try {
      await demoApi.revokeDemoCode(id)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err, t('demo.revokeError')))
    }
  }

  async function copyCode(value) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--pg-accent)]">
          Super Admin
        </p>
        <h1 className="pg-section-title mt-2">{t('demo.adminTitle')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--pg-text-muted)]">{t('demo.adminSubtitle')}</p>
      </header>

      <CutFrame size="lg" className="mb-6 block" innerClassName="bg-[#0e131f] p-5 sm:p-6">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="pg-field">
              <span className="pg-field-label">{t('demo.durationLabel')}</span>
              <CutSelect
                className="w-full"
                value={preset}
                onChange={setPreset}
                options={PRESETS.map((item) => ({
                  value: item.id,
                  label: t(item.labelKey),
                }))}
              />
            </label>
            {preset === 'custom' ? (
              <label className="pg-field">
                <span className="pg-field-label">{t('demo.customHours')}</span>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={customHours}
                  onChange={(event) => setCustomHours(event.target.value)}
                  className="pg-field-control"
                />
              </label>
            ) : (
              <div className="flex items-end text-sm text-slate-400">
                {t('demo.durationSummary', { hours: durationHours })}
              </div>
            )}
          </div>
          <NeonButton type="submit" disabled={creating}>
            {creating ? t('demo.generating') : t('demo.generate')}
          </NeonButton>
        </form>

        {created ? (
          <div className="mt-5 rounded-lg border border-[var(--pg-accent)]/30 bg-[var(--pg-accent)]/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--pg-accent)]">
              {t('demo.createdLabel')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <code className="text-lg font-bold tracking-[0.16em] text-white">{created.code}</code>
              <NeonButton type="button" size="sm" variant="ghost" onClick={() => copyCode(created.code)}>
                {copied ? t('demo.copied') : t('demo.copy')}
              </NeonButton>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {t('demo.createdHint', { hours: created.duration_hours })}
            </p>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      </CutFrame>

      <CutFrame size="lg" className="block" innerClassName="bg-[#0e131f] p-0 overflow-hidden">
        <div className="border-b border-white/[0.05] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          {t('demo.listTitle')}
        </div>
        {loading ? (
          <p className="px-5 py-8 text-sm text-slate-400">{t('common.loading')}</p>
        ) : codes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400">{t('demo.emptyList')}</p>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {codes.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold tracking-[0.12em] text-white">{item.code}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.duration_hours}h
                    {' · '}
                    {item.is_used ? t('demo.statusUsed') : t('demo.statusUnused')}
                    {item.expires_at ? ` · ${new Date(item.expires_at).toLocaleString('fr-FR')}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!item.is_used ? (
                    <>
                      <NeonButton type="button" size="sm" variant="ghost" onClick={() => copyCode(item.code)}>
                        {t('demo.copy')}
                      </NeonButton>
                      <NeonButton type="button" size="sm" variant="danger" onClick={() => handleRevoke(item.id)}>
                        {t('demo.revoke')}
                      </NeonButton>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CutFrame>
    </div>
  )
}
