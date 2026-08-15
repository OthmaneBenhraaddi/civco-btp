import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useTranslation } from '../../i18n/LanguageContext'
import { FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import TenantBrandingFields, {
  EMPTY_BRANDING_FORM,
  brandingPayloadFromForm,
} from './TenantBrandingFields'

const emptyForm = {
  name: '',
  subdomain: '',
  status: 'active',
  ...EMPTY_BRANDING_FORM,
}

const LOGO_ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml'

export default function EntityCreationWizard({ saving, onSubmit }) {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [stepError, setStepError] = useState('')

  function resetWizard() {
    setStep(1)
    setForm(emptyForm)
    setLogoFile(null)
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview)
    }
    setLogoPreview(null)
    setDragOver(false)
    setStepError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function applyLogoFile(file) {
    setLogoFile(file)
    setStepError('')

    if (logoPreview) {
      URL.revokeObjectURL(logoPreview)
    }

    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }

  function handleLogoInputChange(event) {
    applyLogoFile(event.target.files?.[0] ?? null)
  }

  function handleNextFromStep1(event) {
    event.preventDefault()
    setStepError('')

    if (!form.name.trim() || !form.subdomain.trim()) {
      setStepError(t('superAdmin.wizard.step1Required'))
      return
    }

    setStep(2)
  }

  function handleNextFromStep2(event) {
    event.preventDefault()
    setStepError('')
    setStep(3)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStepError('')

    await onSubmit({
      name: form.name.trim(),
      subdomain: form.subdomain.trim().toLowerCase(),
      status: form.status,
      logo: logoFile || undefined,
      ...brandingPayloadFromForm(form),
    })

    resetWizard()
  }

  return (
    <section className="card mb-6 p-6 lg:max-w-xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {[1, 2, 3].map((value) => (
          <div key={value} className="flex items-center gap-2">
            <span
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                step >= value
                  ? 'bg-[var(--pg-accent-dim)] text-[var(--pg-accent)] ring-1 ring-[rgba(34,197,94,0.35)]'
                  : 'bg-white/5 text-slate-500 ring-1 ring-white/10',
              ].join(' ')}
            >
              {value}
            </span>
            <span className={step === value ? 'text-sm font-medium text-white' : 'text-sm text-slate-500'}>
              {value === 1
                ? t('superAdmin.wizard.step1Title')
                : value === 2
                  ? t('superAdmin.wizard.step2Title')
                  : t('superAdmin.wizard.step3Title')}
            </span>
            {value < 3 ? <span className="text-slate-600">→</span> : null}
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-white">{t('superAdmin.createEntity')}</h2>

      {stepError ? <p className="error mb-4">{stepError}</p> : null}

      {step === 1 ? (
        <form className="stack" onSubmit={handleNextFromStep1}>
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
            <CutSelect
              className="w-full"
              value={form.status}
              onChange={(nextValue) => setForm({ ...form, status: nextValue })}
              options={[
                { value: 'active', label: t('status.active') },
                { value: 'inactive', label: t('status.inactive') },
                { value: 'archived', label: t('status.archived') },
              ]}
            />
          </label>
          <div className="entity-wizard-actions flex flex-wrap items-center gap-2.5 pt-2">
            <NeonButton type="submit" size="sm" className="entity-wizard-cta">
              {t('superAdmin.wizard.next')}
            </NeonButton>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form className="stack" onSubmit={handleNextFromStep2}>
          <p className="text-sm text-slate-400">{t('superAdmin.wizard.step2Hint')}</p>

          <div>
            <p className={LABEL_CLASS}>
              {t('superAdmin.wizard.logoLabel')}
              <span className="ml-1 font-medium normal-case tracking-normal text-slate-500">
                ({t('superAdmin.wizard.logoOptional')})
              </span>
            </p>
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragOver(false)
                const dropped = event.dataTransfer.files?.[0]
                if (dropped) applyLogoFile(dropped)
              }}
              className={`pg-dropzone mt-2 ${dragOver ? 'is-active' : ''}`}
            >
              <div className="pg-dropzone__face">
                <Upload className="mx-auto mb-2 h-5 w-5 text-[var(--pg-accent)]" />
                <p className="text-sm text-slate-300">{t('superAdmin.wizard.logoDropHint')}</p>
                <p className="mt-1 text-xs text-[var(--pg-text-dim)]">
                  {t('superAdmin.wizard.logoFormats')}
                </p>

                {logoFile ? (
                  <p className="mt-3 text-xs font-semibold text-emerald-300">{logoFile.name}</p>
                ) : null}

                {logoPreview ? (
                  <div className="mt-4 flex justify-center">
                    <img
                      src={logoPreview}
                      alt={t('superAdmin.wizard.logoPreview')}
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <NeonButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {t('superAdmin.wizard.logoChoose')}
                    </span>
                  </NeonButton>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={LOGO_ACCEPT}
                  className="hidden"
                  onChange={handleLogoInputChange}
                />
              </div>
            </div>
          </div>

          <div className="entity-wizard-actions flex flex-wrap items-center gap-2.5 pt-2">
            <NeonButton
              type="button"
              variant="neon"
              size="sm"
              disabled={saving}
              className="entity-wizard-cta"
              onClick={() => setStep(1)}
            >
              {t('superAdmin.wizard.back')}
            </NeonButton>
            <NeonButton type="submit" size="sm" className="entity-wizard-cta">
              {t('superAdmin.wizard.next')}
            </NeonButton>
          </div>
        </form>
      ) : null}

      {step === 3 ? (
        <form className="stack" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-400">{t('superAdmin.wizard.step3Hint')}</p>

          <TenantBrandingFields
            form={form}
            onChange={setForm}
            t={t}
          />

          <div className="entity-wizard-actions flex flex-wrap items-center gap-2.5 pt-2">
            <NeonButton
              type="button"
              variant="neon"
              size="sm"
              disabled={saving}
              className="entity-wizard-cta"
              onClick={() => setStep(2)}
            >
              {t('superAdmin.wizard.back')}
            </NeonButton>
            <NeonButton
              type="submit"
              size="sm"
              disabled={saving}
              className={`entity-wizard-cta ${saving ? 'opacity-45' : ''}`}
            >
              {saving ? t('superAdmin.creating') : t('superAdmin.create.submit')}
            </NeonButton>
          </div>
        </form>
      ) : null}
    </section>
  )
}
