import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as authApi from '../../api/auth'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { BTN_PRIMARY, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { broadcastTeamDirectoryRefresh } from './profileSyncEvents'
import { appendCredentialUpdateLog } from '../super-admin/data/superAdminPlatformLogStore'

export default function ProfileSettingsPage() {
  const { t } = useTranslation()
  const { user, refresh } = useAuth()
  const [form, setForm] = useState({
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const previousEmail = user?.email ?? ''
      const nextEmail = form.email.trim()
      const passwordChanged = Boolean(form.password)
      const emailChanged = previousEmail !== nextEmail
      const roleLabel = user?.job_title ?? 'Membre'
      await authApi.updateProfile({
        email: nextEmail,
        password: form.password || undefined,
        password_confirmation: form.password_confirmation || undefined,
      })

      await refresh()
      appendCredentialUpdateLog(
        user ?? {},
        roleLabel,
        nextEmail,
        user?.full_name ?? user?.name ?? 'Utilisateur',
        { emailChanged, passwordChanged },
      )
      broadcastTeamDirectoryRefresh()

      setForm((current) => ({
        ...current,
        password: '',
        password_confirmation: '',
      }))
      setSuccess(t('profile.saved'))
    } catch (err) {
      setError(extractErrorMessage(err, t('profile.saveError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('profile.title')}</h1>
          <p>{t('profile.subtitle')}</p>
        </div>
      </header>

      <section className="card max-w-xl p-6">
        <form className="stack" onSubmit={handleSubmit}>
          <label className={LABEL_CLASS}>
            {t('profile.email')}
            <input
              type="email"
              className={FIELD_CLASS}
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>

          <label className={LABEL_CLASS}>
            {t('profile.newPassword')}
            <input
              type="password"
              className={FIELD_CLASS}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              minLength={8}
            />
          </label>

          <label className={LABEL_CLASS}>
            {t('profile.confirmPassword')}
            <input
              type="password"
              className={FIELD_CLASS}
              value={form.password_confirmation}
              onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))}
              minLength={8}
            />
          </label>

          {error ? <p className="error">{error}</p> : null}
          {success ? <p className="hint text-emerald-400">{success}</p> : null}

          <button type="submit" className={BTN_PRIMARY} disabled={saving}>
            {saving ? t('common.saving') : t('profile.save')}
          </button>
        </form>
      </section>
    </div>
  )
}
