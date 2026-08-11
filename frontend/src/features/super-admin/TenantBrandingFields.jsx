import { FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'

export const EMPTY_BRANDING_FORM = {
  custom_domain: '',
  mail_from_address: '',
  mail_host: '',
  mail_port: '',
  mail_username: '',
  mail_password: '',
  mail_encryption: 'tls',
}

export function brandingFromTenant(tenant) {
  return {
    custom_domain: tenant?.custom_domain ?? '',
    mail_from_address: tenant?.mail_from_address ?? '',
    mail_host: tenant?.mail_host ?? '',
    mail_port: tenant?.mail_port != null ? String(tenant.mail_port) : '',
    mail_username: tenant?.mail_username ?? '',
    mail_password: '',
    mail_encryption: tenant?.mail_encryption || 'tls',
  }
}

export function brandingPayloadFromForm(form) {
  return {
    custom_domain: form.custom_domain.trim() || null,
    mail_from_address: form.mail_from_address.trim() || null,
    mail_host: form.mail_host.trim() || null,
    mail_port: form.mail_port === '' ? null : Number(form.mail_port),
    mail_username: form.mail_username.trim() || null,
    mail_encryption: form.mail_encryption || null,
    ...(form.mail_password.trim()
      ? { mail_password: form.mail_password }
      : {}),
  }
}

export default function TenantBrandingFields({ form, onChange, t, passwordHint }) {
  function update(field, value) {
    onChange({ ...form, [field]: value })
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/[0.06] bg-[#0a0b0d]/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">
          {t('superAdmin.branding.title')}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {t('superAdmin.branding.subtitle')}
        </p>
      </div>

      <label className={LABEL_CLASS}>
        {t('superAdmin.branding.customDomain')}
        <input
          className={FIELD_CLASS}
          value={form.custom_domain}
          onChange={(event) => update('custom_domain', event.target.value.toLowerCase().trim())}
          placeholder={t('superAdmin.branding.customDomainPlaceholder')}
        />
        <span className="mt-1 block text-xs text-slate-500">
          {t('superAdmin.branding.customDomainHint')}
        </span>
      </label>

      <div className="border-t border-white/[0.06] pt-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          {t('superAdmin.branding.smtpTitle')}
        </h4>

        <div className="stack space-y-3">
          <label className={LABEL_CLASS}>
            {t('superAdmin.branding.mailFrom')}
            <input
              type="email"
              className={FIELD_CLASS}
              value={form.mail_from_address}
              onChange={(event) => update('mail_from_address', event.target.value)}
              placeholder="noreply@monentreprise.com"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL_CLASS}>
              {t('superAdmin.branding.mailHost')}
              <input
                className={FIELD_CLASS}
                value={form.mail_host}
                onChange={(event) => update('mail_host', event.target.value)}
                placeholder="smtp.monentreprise.com"
              />
            </label>
            <label className={LABEL_CLASS}>
              {t('superAdmin.branding.mailPort')}
              <input
                type="number"
                min="1"
                max="65535"
                className={FIELD_CLASS}
                value={form.mail_port}
                onChange={(event) => update('mail_port', event.target.value)}
                placeholder="587"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={LABEL_CLASS}>
              {t('superAdmin.branding.mailUsername')}
              <input
                className={FIELD_CLASS}
                value={form.mail_username}
                onChange={(event) => update('mail_username', event.target.value)}
                autoComplete="off"
              />
            </label>
            <label className={LABEL_CLASS}>
              {t('superAdmin.branding.mailPassword')}
              <input
                type="password"
                className={FIELD_CLASS}
                value={form.mail_password}
                onChange={(event) => update('mail_password', event.target.value)}
                autoComplete="new-password"
                placeholder={passwordHint || t('superAdmin.branding.mailPasswordPlaceholder')}
              />
            </label>
          </div>

          <label className={LABEL_CLASS}>
            {t('superAdmin.branding.mailEncryption')}
            <select
              className={FIELD_CLASS}
              value={form.mail_encryption}
              onChange={(event) => update('mail_encryption', event.target.value)}
            >
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="none">{t('superAdmin.branding.mailEncryptionNone')}</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  )
}
