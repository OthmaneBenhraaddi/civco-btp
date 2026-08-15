import { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, Trash2, Upload } from 'lucide-react'
import PageShell from '../../components/prodigy/PageShell'
import NeonButton from '../../components/prodigy/NeonButton'
import CutSelect from '../../components/prodigy/CutSelect'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as authApi from '../../api/auth'
import { BENTO_CARD_CLASS, FIELD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'
import { resolveProfileRoleLabel } from '../../utils/authIdentity'
import { broadcastTeamDirectoryRefresh } from './profileSyncEvents'
import { appendCredentialUpdateLog } from '../super-admin/data/superAdminPlatformLogStore'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

function buildInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function isAcceptedAvatar(file) {
  return Boolean(file) && ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_AVATAR_BYTES
}

export default function ProfileSettingsPage() {
  const { t, locale, setLocale } = useTranslation()
  const { user, company, tenant, roles, refresh } = useAuth()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    job_title: user?.job_title ?? '',
  })
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setForm({
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      job_title: user?.job_title ?? '',
    })
    setAvatarUrl(user?.avatar_url ?? null)
  }, [user])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const displayName = useMemo(() => {
    const composed = `${form.first_name} ${form.last_name}`.trim()
    return composed || user?.full_name || t('layout.profileFallbackName')
  }, [form.first_name, form.last_name, user?.full_name, t])

  const initials = buildInitials(displayName)
  const roleLabel = resolveProfileRoleLabel(user, roles, t)
  const orgName = tenant?.name || company?.name || ''
  const roleBadge = orgName ? `${roleLabel} — ${orgName}` : roleLabel
  const shownAvatar = previewUrl || avatarUrl

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function applyAvatarFile(file) {
    setError('')
    setSuccess('')

    if (!isAcceptedAvatar(file)) {
      setError(t('profile.avatarInvalid'))
      return
    }

    clearPreview()
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleAvatarUpload() {
    if (!selectedFile) {
      fileInputRef.current?.click()
      return
    }

    setAvatarBusy(true)
    setError('')
    setSuccess('')

    try {
      const data = await authApi.uploadAvatar(selectedFile)
      setAvatarUrl(data.user?.avatar_url ?? null)
      clearPreview()
      await refresh()
      broadcastTeamDirectoryRefresh()
      setSuccess(t('profile.avatarSaved'))
    } catch (err) {
      setError(extractErrorMessage(err, t('profile.avatarSaveError')))
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleAvatarRemove() {
    setAvatarBusy(true)
    setError('')
    setSuccess('')

    try {
      if (selectedFile || previewUrl) {
        clearPreview()
      } else {
        const data = await authApi.deleteAvatar()
        setAvatarUrl(data.user?.avatar_url ?? null)
        await refresh()
        broadcastTeamDirectoryRefresh()
      }
      setSuccess(t('profile.avatarRemoved'))
    } catch (err) {
      setError(extractErrorMessage(err, t('profile.avatarRemoveError')))
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const previousEmail = user?.email ?? ''
      const nextEmail = form.email.trim()
      const emailChanged = previousEmail !== nextEmail

      if (selectedFile) {
        await authApi.uploadAvatar(selectedFile)
        clearPreview()
      }

      await authApi.updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: nextEmail,
        phone: form.phone.trim() || null,
        job_title: form.job_title.trim() || null,
      })

      await refresh()
      appendCredentialUpdateLog(
        user ?? {},
        roleLabel,
        nextEmail,
        displayName,
        { emailChanged, passwordChanged: false },
      )
      broadcastTeamDirectoryRefresh()
      setSuccess(t('profile.saved'))
    } catch (err) {
      setError(extractErrorMessage(err, t('profile.saveError')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell title={t('profile.title')} subtitle={t('profile.subtitle')} compact>
      <form className={`${BENTO_CARD_CLASS} overflow-hidden`} onSubmit={handleSubmit}>
        <div className="grid gap-0 lg:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.4fr)]">
          <aside className="border-b border-slate-800 bg-[#0b0f17]/50 p-6 lg:border-b-0 lg:border-r">
            <div className="flex flex-col items-center text-center">
              <div className="pg-cut-shell pg-cut-shell--md mb-4 h-28 w-28">
                <div className="pg-cut-shell__inner grid h-full place-items-center overflow-hidden bg-[#121826]">
                  {shownAvatar ? (
                    <img src={shownAvatar} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold tracking-wide text-white">{initials || '??'}</span>
                  )}
                </div>
              </div>

              <h2 className="m-0 text-lg font-bold text-white">{displayName}</h2>
              <p className="mt-2 inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-300">
                {roleBadge}
              </p>

              <p className="mt-4 text-xs text-slate-500">{t('profile.avatarHint')}</p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <NeonButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={avatarBusy || saving}
                  onClick={() => (selectedFile ? handleAvatarUpload() : fileInputRef.current?.click())}
                >
                  <span className="inline-flex items-center gap-2">
                    {selectedFile ? <Upload className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                    {selectedFile ? t('profile.avatarUpload') : t('profile.avatarChange')}
                  </span>
                </NeonButton>
                {(shownAvatar || selectedFile) ? (
                  <NeonButton
                    type="button"
                    variant="danger"
                    size="sm"
                    disabled={avatarBusy || saving}
                    onClick={handleAvatarRemove}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('profile.avatarRemove')}
                    </span>
                  </NeonButton>
                ) : null}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                className="hidden"
                onChange={(event) => applyAvatarFile(event.target.files?.[0])}
              />
            </div>
          </aside>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <label>
              <span className={LABEL_CLASS}>{t('profile.firstName')}</span>
              <input
                className={FIELD_CLASS}
                value={form.first_name}
                onChange={(event) => updateField('first_name', event.target.value)}
                required
              />
            </label>

            <label>
              <span className={LABEL_CLASS}>{t('profile.lastName')}</span>
              <input
                className={FIELD_CLASS}
                value={form.last_name}
                onChange={(event) => updateField('last_name', event.target.value)}
                required
              />
            </label>

            <label className="sm:col-span-2">
              <span className={LABEL_CLASS}>{t('profile.email')}</span>
              <input
                type="email"
                className={FIELD_CLASS}
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
            </label>

            <label>
              <span className={LABEL_CLASS}>{t('profile.phone')}</span>
              <input
                className={FIELD_CLASS}
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                placeholder={t('profile.phonePlaceholder')}
              />
            </label>

            <label>
              <span className={LABEL_CLASS}>{t('profile.jobTitle')}</span>
              <input
                className={FIELD_CLASS}
                value={form.job_title}
                onChange={(event) => updateField('job_title', event.target.value)}
                placeholder={t('profile.jobTitlePlaceholder')}
              />
            </label>

            <div className="sm:col-span-2">
              <span className={LABEL_CLASS}>{t('profile.language')}</span>
              <CutSelect
                className="mt-1 w-full"
                size="sm"
                value={locale}
                onChange={(nextLocale) => setLocale?.(nextLocale)}
                options={[
                  { value: 'fr', label: t('profile.languages.fr') },
                  { value: 'en', label: t('profile.languages.en') },
                ]}
              />
            </div>

            {error ? <p className="error sm:col-span-2">{error}</p> : null}
            {success ? <p className="sm:col-span-2 text-sm text-emerald-400">{success}</p> : null}

            <div className="sm:col-span-2">
              <NeonButton type="submit" disabled={saving || avatarBusy} className="w-full sm:w-auto">
                {saving ? t('common.saving') : t('profile.save')}
              </NeonButton>
            </div>
          </div>
        </div>
      </form>
    </PageShell>
  )
}
