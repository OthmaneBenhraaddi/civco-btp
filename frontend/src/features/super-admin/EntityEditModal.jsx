import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import CutSelect from '../../components/prodigy/CutSelect'
import { useTranslation } from '../../i18n/LanguageContext'
import { BTN_PRIMARY, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import TenantBrandingFields, {
  EMPTY_BRANDING_FORM,
  brandingFromTenant,
  brandingPayloadFromForm,
} from './TenantBrandingFields'

export default function EntityEditModal({ tenant, open, saving, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    status: 'active',
    ...EMPTY_BRANDING_FORM,
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !tenant) {
      return
    }

    setForm({
      name: tenant.name ?? '',
      subdomain: tenant.subdomain ?? '',
      status: tenant.status ?? 'active',
      ...brandingFromTenant(tenant),
    })
    setError('')
  }, [open, tenant])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      await onSubmit({
        name: form.name.trim(),
        subdomain: form.subdomain.trim().toLowerCase(),
        status: form.status,
        ...brandingPayloadFromForm(form),
      })
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.edit.error')))
    }
  }

  return (
    <Modal
      title={t('superAdmin.edit.title')}
      open={open}
      onClose={onClose}
      panelClassName="max-w-xl"
    >
      <form className="stack" onSubmit={handleSubmit}>
        <p className="text-sm text-slate-400">{t('superAdmin.edit.hint')}</p>

        {error ? <p className="error">{error}</p> : null}

        <label className={LABEL_CLASS}>
          {t('superAdmin.companyName')}
          <input
            className={FIELD_CLASS}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
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

        <TenantBrandingFields
          form={form}
          onChange={setForm}
          t={t}
          passwordHint={
            tenant?.mail_password_set
              ? t('superAdmin.branding.mailPasswordKeepHint')
              : undefined
          }
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="submit" className={BTN_PRIMARY} disabled={saving}>
            {saving ? t('common.saving') : t('superAdmin.edit.save')}
          </button>
          <button type="button" className="ghost" disabled={saving} onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
