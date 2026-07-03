import { useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import { BTN_PRIMARY, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'

const emptyForm = {
  name: '',
  subdomain: '',
  status: 'active',
}

export default function EntityCreationWizard({ saving, onSubmit }) {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [stepError, setStepError] = useState('')

  function resetWizard() {
    setStep(1)
    setForm(emptyForm)
    setLogoFile(null)
    setLogoPreview(null)
    setStepError('')
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0] ?? null
    setLogoFile(file)
    setStepError('')

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview)
    }

    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  function handleNextStep(event) {
    event.preventDefault()
    setStepError('')

    if (!form.name.trim() || !form.subdomain.trim()) {
      setStepError(t('superAdmin.wizard.step1Required'))
      return
    }

    setStep(2)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStepError('')

    if (!logoFile) {
      setStepError(t('superAdmin.wizard.logoRequired'))
      return
    }

    await onSubmit({
      name: form.name.trim(),
      subdomain: form.subdomain.trim().toLowerCase(),
      status: form.status,
      logo: logoFile,
    })

    resetWizard()
  }

  return (
    <section className="card mb-6 p-6 lg:max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        {[1, 2].map((value) => (
          <div key={value} className="flex items-center gap-2">
            <span
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                step >= value
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
                  : 'bg-white/5 text-slate-500 ring-1 ring-white/10',
              ].join(' ')}
            >
              {value}
            </span>
            <span className={step === value ? 'text-sm font-medium text-white' : 'text-sm text-slate-500'}>
              {value === 1 ? t('superAdmin.wizard.step1Title') : t('superAdmin.wizard.step2Title')}
            </span>
            {value === 1 ? <span className="text-slate-600">→</span> : null}
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-white">{t('superAdmin.createEntity')}</h2>

      {stepError ? <p className="error mb-4">{stepError}</p> : null}

      {step === 1 ? (
        <form className="stack" onSubmit={handleNextStep}>
          <label className={LABEL_CLASS}>
            {t('superAdmin.companyName')}
            <input
              className={FIELD_CLASS}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="CIVCO BTP"
              required
            />
          </label>
          <label className={LABEL_CLASS}>
            {t('superAdmin.subdomain')}
            <div className="flex items-center gap-2">
              <input
                className={FIELD_CLASS}
                value={form.subdomain}
                onChange={(event) => setForm({
                  ...form,
                  subdomain: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                })}
                placeholder="civco"
                pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
                required
              />
              <span className="shrink-0 text-sm text-slate-500">.monerp.com</span>
            </div>
          </label>
          <label className={LABEL_CLASS}>
            {t('superAdmin.status')}
            <select
              className={FIELD_CLASS}
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option value="active">{t('status.active')}</option>
              <option value="inactive">{t('status.inactive')}</option>
              <option value="archived">{t('status.archived')}</option>
            </select>
          </label>
          <button type="submit" className={BTN_PRIMARY}>
            {t('superAdmin.wizard.next')}
          </button>
        </form>
      ) : (
        <form className="stack" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-400">{t('superAdmin.wizard.step2Hint')}</p>

          <label className={LABEL_CLASS}>
            {t('superAdmin.wizard.logoLabel')}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className={FIELD_CLASS}
              onChange={handleLogoChange}
              required
            />
          </label>

          {logoPreview ? (
            <div className="rounded-xl border border-white/[0.06] bg-[#0a0b0d]/40 p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                {t('superAdmin.wizard.logoPreview')}
              </p>
              <img
                src={logoPreview}
                alt={t('superAdmin.wizard.logoPreview')}
                className="max-h-24 max-w-full object-contain"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              disabled={saving}
              onClick={() => setStep(1)}
            >
              {t('superAdmin.wizard.back')}
            </button>
            <button type="submit" className={BTN_PRIMARY} disabled={saving}>
              {saving ? t('superAdmin.creating') : t('superAdmin.create')}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
