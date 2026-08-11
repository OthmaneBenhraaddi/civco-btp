import { useCallback, useEffect, useMemo, useState } from 'react'
import * as documentTemplatesApi from '../../api/documentTemplates'
import { useTranslation } from '../../i18n/LanguageContext'
import {
  BENTO_CARD_CLASS,
  BTN_GHOST,
  BTN_PRIMARY,
  FIELD_CLASS,
  LABEL_CLASS,
} from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

const MAX_TEMPLATES = 10

const TEMPLATE_TYPES = [
  { value: 'letter', labelKey: 'documentTemplates.types.letter' },
  { value: 'contract', labelKey: 'documentTemplates.types.contract' },
  { value: 'reminder', labelKey: 'documentTemplates.types.reminder' },
  { value: 'notice', labelKey: 'documentTemplates.types.notice' },
  { value: 'other', labelKey: 'documentTemplates.types.other' },
]

const DEFAULT_PLACEHOLDERS = [
  '{client.name}',
  '{client.email}',
  '{client.phone}',
  '{client.city}',
  '{project.name}',
  '{project.reference}',
  '{project.city}',
  '{tenant.name}',
  '{company.name}',
  '{date}',
  '{date_short}',
]

const EMPTY_FORM = {
  name: '',
  type: 'letter',
  body: '',
}

export default function DocumentTemplatesSettingsPanel() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState([])
  const [placeholders, setPlaceholders] = useState(DEFAULT_PLACEHOLDERS)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const atLimit = templates.length >= MAX_TEMPLATES && !editingId

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [templatesData, placeholdersResponse] = await Promise.all([
        documentTemplatesApi.fetchDocumentTemplates(),
        documentTemplatesApi.fetchDocumentTemplatePlaceholders().catch(() => null),
      ])

      setTemplates(Array.isArray(templatesData) ? templatesData : [])

      const fromApi = placeholdersResponse?.data
      if (Array.isArray(fromApi) && fromApi.length > 0) {
        setPlaceholders(fromApi.map((item) => item.key ?? item))
      }
    } catch (err) {
      setError(extractErrorMessage(err, t('documentTemplates.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData()
  }, [loadData])

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function startEdit(template) {
    setEditingId(template.id)
    setForm({
      name: template.name ?? '',
      type: template.type ?? 'letter',
      body: template.body ?? '',
    })
    setError('')
    setSuccess('')
  }

  function insertPlaceholder(token) {
    setForm((current) => ({
      ...current,
      body: `${current.body}${current.body && !current.body.endsWith(' ') ? ' ' : ''}${token}`,
    }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingId) {
        await documentTemplatesApi.updateDocumentTemplate(editingId, form)
        setSuccess(t('documentTemplates.updated'))
      } else {
        await documentTemplatesApi.createDocumentTemplate(form)
        setSuccess(t('documentTemplates.created'))
      }

      resetForm()
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('documentTemplates.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(template) {
    if (!window.confirm(t('documentTemplates.deleteConfirm', { name: template.name }))) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await documentTemplatesApi.deleteDocumentTemplate(template.id)
      if (editingId === template.id) {
        resetForm()
      }
      setSuccess(t('documentTemplates.deleted'))
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('documentTemplates.deleteError')))
    }
  }

  const typeLabel = useMemo(() => {
    const map = Object.fromEntries(
      TEMPLATE_TYPES.map((item) => [item.value, t(item.labelKey)]),
    )
    return (type) => map[type] ?? type
  }, [t])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className={`${BENTO_CARD_CLASS} space-y-5 p-6`}>
        <header>
          <h2 className="text-lg font-semibold text-white">{t('documentTemplates.title')}</h2>
          <p className="mt-1 text-sm text-slate-400">{t('documentTemplates.subtitle')}</p>
          <p className="mt-2 text-xs text-slate-500">
            {t('documentTemplates.usage', { count: templates.length, limit: MAX_TEMPLATES })}
          </p>
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

        <form className="space-y-4" onSubmit={handleSave}>
          <label className={LABEL_CLASS}>
            {t('documentTemplates.name')}
            <input
              className={FIELD_CLASS}
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder={t('documentTemplates.namePlaceholder')}
              required
            />
          </label>

          <label className={LABEL_CLASS}>
            {t('documentTemplates.type')}
            <select
              className={FIELD_CLASS}
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
              required
            >
              {TEMPLATE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label className={LABEL_CLASS}>
            {t('documentTemplates.body')}
            <textarea
              className={`${FIELD_CLASS} min-h-[220px] font-mono text-xs leading-relaxed`}
              value={form.body}
              onChange={(event) => setForm({ ...form, body: event.target.value })}
              placeholder={t('documentTemplates.bodyPlaceholder')}
              required
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className={BTN_PRIMARY}
              disabled={saving || (atLimit && !editingId)}
            >
              {saving
                ? t('common.saving')
                : editingId
                  ? t('documentTemplates.update')
                  : t('documentTemplates.create')}
            </button>
            {editingId ? (
              <button type="button" className={BTN_GHOST} onClick={resetForm}>
                {t('common.cancel')}
              </button>
            ) : null}
          </div>

          {atLimit ? (
            <p className="text-xs text-amber-300">{t('documentTemplates.limitReached')}</p>
          ) : null}
        </form>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-white">{t('documentTemplates.listTitle')}</h3>
          {loading ? (
            <p className="text-sm text-slate-400">{t('common.loading')}</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-500">{t('documentTemplates.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0a0b0d]/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{template.name}</p>
                    <p className="text-xs text-slate-500">{typeLabel(template.type)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/5"
                      onClick={() => startEdit(template)}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-500/30 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10"
                      onClick={() => handleDelete(template)}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <aside className={`${BENTO_CARD_CLASS} h-fit space-y-4 p-5`}>
        <div>
          <h3 className="text-sm font-semibold text-white">{t('documentTemplates.guideTitle')}</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {t('documentTemplates.guideBody')}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {placeholders.map((token) => (
            <button
              key={token}
              type="button"
              className="rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-1 font-mono text-[11px] text-sky-300 hover:bg-sky-500/15"
              onClick={() => insertPlaceholder(token)}
            >
              {token}
            </button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {t('documentTemplates.guideHint')}
        </p>
      </aside>
    </div>
  )
}
