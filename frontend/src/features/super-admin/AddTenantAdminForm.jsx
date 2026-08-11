import { useState } from 'react'
import { useTranslation } from '../../i18n/LanguageContext'
import { BTN_PRIMARY, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
}

export default function AddTenantAdminForm({ tenant, saving, onSubmit, onCancel }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      await onSubmit({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
      })
      setForm(emptyForm)
    } catch (err) {
      setError(extractErrorMessage(err, t('superAdmin.addAdmin.error')))
    }
  }

  return (
    <form
      className="mt-4 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 p-4"
      onSubmit={handleSubmit}
    >
      <h4 className="text-sm font-semibold text-white">{t('superAdmin.addAdmin.title')}</h4>
      <p className="mt-1 text-xs text-slate-400">
        {t('superAdmin.addAdmin.hint', { name: tenant.name })}
      </p>

      {error ? <p className="error mt-3 text-sm">{error}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className={LABEL_CLASS}>
          {t('superAdmin.addAdmin.firstName')}
          <input
            className={FIELD_CLASS}
            value={form.first_name}
            onChange={(event) => setForm({ ...form, first_name: event.target.value })}
            required
          />
        </label>
        <label className={LABEL_CLASS}>
          {t('superAdmin.addAdmin.lastName')}
          <input
            className={FIELD_CLASS}
            value={form.last_name}
            onChange={(event) => setForm({ ...form, last_name: event.target.value })}
            required
          />
        </label>
        <label className={`${LABEL_CLASS} sm:col-span-2`}>
          {t('superAdmin.adminEmail')}
          <input
            type="email"
            className={FIELD_CLASS}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder={t('superAdmin.addAdmin.emailPlaceholder', { subdomain: tenant.subdomain })}
            required
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>
          {saving ? t('superAdmin.addAdmin.creating') : t('superAdmin.addAdmin.submit')}
        </button>
        {onCancel ? (
          <button
            type="button"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            disabled={saving}
            onClick={onCancel}
          >
            {t('common.cancel')}
          </button>
        ) : null}
      </div>
    </form>
  )
}
