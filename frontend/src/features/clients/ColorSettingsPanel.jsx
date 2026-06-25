import { useEffect, useState } from 'react'
import RoleBadge from '../../components/RoleBadge'
import StatusBadge from '../../components/StatusBadge'
import { useTheme } from '../../context/ThemeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { THEME_COLOR_DEFAULTS, THEME_COLOR_GROUPS } from '../../theme/themeColorDefaults'
import { extractErrorMessage } from '../../utils/apiHelpers'

function ColorField({ label, value, onChange }) {
  return (
    <label className="grid gap-2 rounded-xl border border-slate-800/80 bg-[#1a1b20] p-4">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="h-10 w-14 cursor-pointer rounded-lg border border-slate-700 bg-transparent p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          pattern="^#[0-9A-Fa-f]{6}$"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-[#111827] px-3 py-2 font-mono text-sm text-slate-200"
        />
      </div>
    </label>
  )
}

export default function ColorSettingsPanel() {
  const { t } = useTranslation()
  const { colors, loading, saveColors } = useTheme()
  const [draft, setDraft] = useState(colors)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setDraft(colors)
  }, [colors])

  function updateColor(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
    setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await saveColors(draft)
      setSuccess(t('theme.saveSuccess'))
    } catch (err) {
      setError(extractErrorMessage(err, t('theme.saveError')))
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setDraft({ ...THEME_COLOR_DEFAULTS })
    setSuccess('')
    setError('')
  }

  if (loading) {
    return <p className="text-sm text-slate-400">{t('common.loading')}</p>
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-2xl border border-slate-800/80 bg-[#1f2937] p-5">
        <h2 className="text-lg font-semibold text-white">{t('theme.title')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('theme.subtitle')}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge status="accepted" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="overdue" />
          <RoleBadge label={t('theme.previewRole')} tone="purple" />
          <RoleBadge label={t('theme.previewRole')} tone="sky" />
        </div>
      </div>

      {THEME_COLOR_GROUPS.map((group) => (
        <section key={group.id} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            {t(group.labelKey)}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.keys.map((key) => (
              <ColorField
                key={key}
                label={t(`theme.keys.${key}`)}
                value={draft[key] ?? THEME_COLOR_DEFAULTS[key]}
                onChange={(value) => updateColor(key, value)}
              />
            ))}
          </div>
        </section>
      ))}

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('theme.save')}
        </button>
        <button type="button" className="ghost" onClick={handleReset}>
          {t('theme.resetDefaults')}
        </button>
      </div>
    </form>
  )
}
