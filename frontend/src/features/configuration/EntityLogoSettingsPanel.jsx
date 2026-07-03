import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as tenantSettingsApi from '../../api/tenantSettings'
import { BENTO_CARD_CLASS, BTN_PRIMARY, BTN_GHOST } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']

function isAcceptedImage(file) {
  return ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
}

export default function EntityLogoSettingsPanel() {
  const { t } = useTranslation()
  const { tenant, refresh } = useAuth()
  const inputRef = useRef(null)

  const [logoUrl, setLogoUrl] = useState(tenant?.logo_url ?? null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadLogo = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await tenantSettingsApi.fetchTenantLogo()
      setLogoUrl(data.tenant?.logo_url ?? null)
    } catch (err) {
      setError(extractErrorMessage(err, t('configuration.entityLogo.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadLogo()
  }, [loadLogo])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function resetSelection() {
    setSelectedFile(null)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  function applyFile(file) {
    setError('')
    setSuccess('')

    if (!isAcceptedImage(file)) {
      setError(t('configuration.entityLogo.invalidFile'))
      return
    }

    resetSelection()
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleFileInput(event) {
    const file = event.target.files?.[0]
    if (file) {
      applyFile(file)
    }
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragActive(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      applyFile(file)
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError(t('configuration.entityLogo.fileRequired'))
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const data = await tenantSettingsApi.uploadTenantLogo(selectedFile)
      const nextLogoUrl = data.tenant?.logo_url ?? null
      setLogoUrl(nextLogoUrl)
      resetSelection()
      setSuccess(t('configuration.entityLogo.saveSuccess'))
      await refresh()
    } catch (err) {
      setError(extractErrorMessage(err, t('configuration.entityLogo.saveError')))
    } finally {
      setSaving(false)
    }
  }

  const displayUrl = previewUrl ?? logoUrl

  return (
    <section className={`${BENTO_CARD_CLASS} space-y-6 p-6`}>
      <header>
        <h2 className="text-lg font-semibold text-white">{t('configuration.entityLogo.title')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('configuration.entityLogo.subtitle')}</p>
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
        <>
          <div className="flex flex-wrap items-start gap-6">
            <div className="rounded-xl border border-white/[0.08] bg-[#111214] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {t('configuration.entityLogo.current')}
              </p>
              {displayUrl ? (
                <img
                  src={displayUrl}
                  alt={tenant?.name ?? t('configuration.entityLogo.title')}
                  className="max-h-24 max-w-[220px] object-contain object-left"
                />
              ) : (
                <div className="flex h-24 w-[220px] items-center justify-center rounded-lg border border-dashed border-white/10 text-sm text-slate-500">
                  {t('configuration.entityLogo.noLogo')}
                </div>
              )}
            </div>

            <div
              className={[
                'min-w-[280px] flex-1 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                dragActive
                  ? 'border-indigo-400/60 bg-indigo-500/10'
                  : 'border-white/10 bg-[#111214] hover:border-white/20',
              ].join(' ')}
              onDragEnter={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={(event) => {
                event.preventDefault()
                setDragActive(false)
              }}
              onDrop={handleDrop}
            >
              <p className="text-sm font-medium text-slate-200">
                {t('configuration.entityLogo.dropTitle')}
              </p>
              <p className="mt-1 text-xs text-slate-500">{t('configuration.entityLogo.dropHint')}</p>
              <button
                type="button"
                className={`${BTN_GHOST} mt-4`}
                onClick={() => inputRef.current?.click()}
              >
                {t('configuration.entityLogo.browse')}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </div>

          {selectedFile ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-400">
                {t('configuration.entityLogo.selected', { name: selectedFile.name })}
              </p>
              <button type="button" className={BTN_GHOST} onClick={resetSelection}>
                {t('configuration.entityLogo.clearSelection')}
              </button>
              <button type="button" className={BTN_PRIMARY} disabled={saving} onClick={handleUpload}>
                {saving ? t('common.saving') : t('configuration.entityLogo.save')}
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
