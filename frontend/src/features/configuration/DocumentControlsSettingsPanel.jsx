import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import * as tenantDocumentControlsApi from '../../api/tenantDocumentControls'
import { BENTO_CARD_CLASS, BTN_PRIMARY } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

const DEFAULT_LIMITS = {
  max_official_devis_with_header: 2,
  max_official_devis_without_header: 2,
  max_official_invoices_with_header: 2,
  max_official_invoices_without_header: 2,
  max_official_delivery_forms_with_header: 2,
  max_official_delivery_forms_without_header: 2,
  max_official_contracts_with_header: 2,
  max_official_contracts_without_header: 2,
}

const LIMIT_GROUPS = [
  {
    titleKey: 'configuration.documentControls.devis',
    withKey: 'max_official_devis_with_header',
    withoutKey: 'max_official_devis_without_header',
  },
  {
    titleKey: 'configuration.documentControls.invoices',
    withKey: 'max_official_invoices_with_header',
    withoutKey: 'max_official_invoices_without_header',
  },
  {
    titleKey: 'configuration.documentControls.deliveryForms',
    withKey: 'max_official_delivery_forms_with_header',
    withoutKey: 'max_official_delivery_forms_without_header',
  },
  {
    titleKey: 'configuration.documentControls.contracts',
    withKey: 'max_official_contracts_with_header',
    withoutKey: 'max_official_contracts_without_header',
  },
]

function normalizeLimits(raw = {}) {
  return {
    max_official_devis_with_header: Number(raw.max_official_devis_with_header ?? raw.max_official_devis ?? 2),
    max_official_devis_without_header: Number(raw.max_official_devis_without_header ?? raw.max_official_devis ?? 2),
    max_official_invoices_with_header: Number(raw.max_official_invoices_with_header ?? raw.max_official_invoices ?? 2),
    max_official_invoices_without_header: Number(raw.max_official_invoices_without_header ?? raw.max_official_invoices ?? 2),
    max_official_delivery_forms_with_header: Number(raw.max_official_delivery_forms_with_header ?? raw.max_official_delivery_forms ?? 2),
    max_official_delivery_forms_without_header: Number(raw.max_official_delivery_forms_without_header ?? raw.max_official_delivery_forms ?? 2),
    max_official_contracts_with_header: Number(raw.max_official_contracts_with_header ?? raw.max_official_contracts ?? 2),
    max_official_contracts_without_header: Number(raw.max_official_contracts_without_header ?? raw.max_official_contracts ?? 2),
  }
}

export default function DocumentControlsSettingsPanel() {
  const { t } = useTranslation()
  const [limits, setLimits] = useState(DEFAULT_LIMITS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadControls = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await tenantDocumentControlsApi.fetchDocumentControls()
      setLimits(normalizeLimits(data.document_controls ?? {}))
    } catch (err) {
      setError(extractErrorMessage(err, t('configuration.documentControls.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadControls()
  }, [loadControls])

  function handleChange(key, value) {
    const parsed = Number.parseInt(value, 10)
    setLimits((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
    }))
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const data = await tenantDocumentControlsApi.updateDocumentControls(limits)
      setLimits(normalizeLimits(data.document_controls ?? {}))
      setSuccess(t('configuration.documentControls.saveSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('configuration.documentControls.saveError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`${BENTO_CARD_CLASS} space-y-6 p-6`}>
      <header>
        <h2 className="text-lg font-semibold text-white">{t('configuration.documentControls.title')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('configuration.documentControls.subtitle')}</p>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {LIMIT_GROUPS.map((group) => (
              <div
                key={group.titleKey}
                className="rounded-xl border border-white/[0.06] bg-[#0a0b0d]/35 p-4"
              >
                <p className="mb-3 text-sm font-medium text-slate-200">{t(group.titleKey)}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {t('configuration.documentControls.withHeader')}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      className="w-full rounded-lg border border-white/10 bg-[#111214] px-3 py-2 text-sm text-white"
                      value={limits[group.withKey]}
                      onChange={(event) => handleChange(group.withKey, event.target.value)}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {t('configuration.documentControls.withoutHeader')}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      className="w-full rounded-lg border border-white/10 bg-[#111214] px-3 py-2 text-sm text-white"
                      value={limits[group.withoutKey]}
                      onChange={(event) => handleChange(group.withoutKey, event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs leading-relaxed text-slate-500">{t('configuration.documentControls.hint')}</p>

          <button type="submit" className={BTN_PRIMARY} disabled={saving}>
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </form>
      )}
    </section>
  )
}
