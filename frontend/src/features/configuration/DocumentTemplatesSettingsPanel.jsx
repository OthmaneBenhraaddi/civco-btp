import { useCallback, useEffect, useMemo, useState } from 'react'
import * as documentTemplatesApi from '../../api/documentTemplates'
import CutFrame from '../../components/prodigy/CutFrame'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import UseDocumentTemplateModal from '../../components/UseDocumentTemplateModal'
import { useTranslation } from '../../i18n/LanguageContext'
import {
  BENTO_CARD_CLASS,
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
  '{client.contact_name}',
  '{client.email}',
  '{client.phone}',
  '{client.address}',
  '{client.postal_code}',
  '{client.city}',
  '{client.country}',
  '{project.name}',
  '{project.reference}',
  '{project.address}',
  '{project.postal_code}',
  '{project.city}',
  '{project.start_date}',
  '{project.end_date}',
  '{project.budget}',
  '{project.progress}',
  '{project.status}',
  '{project.sector}',
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

function IconFile({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h4" strokeLinecap="round" />
    </svg>
  )
}

function IconPencil({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4 11.5-11.5z" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrash({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
      <path d="M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12" strokeLinejoin="round" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" strokeLinejoin="round" />
    </svg>
  )
}

function previewBody(body) {
  const text = String(body ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return '—'
  return text.length > 110 ? `${text.slice(0, 110)}…` : text
}

export default function DocumentTemplatesSettingsPanel() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState([])
  const [placeholders, setPlaceholders] = useState(DEFAULT_PLACEHOLDERS)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [usingTemplate, setUsingTemplate] = useState(null)
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
    window.requestAnimationFrame(() => {
      document.getElementById('document-template-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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

        <form id="document-template-form" className="space-y-4" onSubmit={handleSave}>
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
            <CutSelect
              className="w-full"
              size="sm"
              value={form.type}
              onChange={(next) => setForm({ ...form, type: next })}
              required
              options={TEMPLATE_TYPES.map((item) => ({
                value: item.value,
                label: t(item.labelKey),
              }))}
            />
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

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <NeonButton
              type="submit"
              size="sm"
              disabled={saving || (atLimit && !editingId)}
              className={saving || (atLimit && !editingId) ? 'opacity-45' : ''}
            >
              {saving
                ? t('common.saving')
                : editingId
                  ? t('documentTemplates.update')
                  : t('documentTemplates.create')}
            </NeonButton>
            {editingId ? (
              <NeonButton type="button" variant="neon" size="sm" onClick={resetForm}>
                {t('common.cancel')}
              </NeonButton>
            ) : null}
          </div>

          {atLimit ? (
            <p className="text-xs text-amber-300">{t('documentTemplates.limitReached')}</p>
          ) : null}
        </form>

        <div className="border-t border-white/[0.06] pt-5">
          <div className="mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {t('documentTemplates.listTitle')}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {templates.length === 0
                ? t('documentTemplates.empty')
                : t('documentTemplates.usage', { count: templates.length, limit: MAX_TEMPLATES })}
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">{t('common.loading')}</p>
          ) : templates.length === 0 ? (
            <CutFrame size="md" innerClassName="bg-[#0e131f] px-5 py-10 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25">
                <IconFile className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-300">{t('documentTemplates.empty')}</p>
            </CutFrame>
          ) : (
            <ul className="space-y-2.5">
              {templates.map((template) => {
                const isEditing = editingId === template.id
                return (
                  <li key={template.id}>
                    <CutFrame
                      size="sm"
                      className="block"
                      innerClassName={[
                        'bg-[#0e131f] px-4 py-3.5 transition-colors',
                        isEditing ? 'ring-1 ring-emerald-500/35' : '',
                      ].join(' ')}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-emerald-400 ring-1 ring-white/[0.06]">
                            <IconFile className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-white">{template.name}</p>
                              <span className="inline-flex items-center rounded border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-300">
                                {typeLabel(template.type)}
                              </span>
                              {isEditing ? (
                                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-300">
                                  {t('common.edit')}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {previewBody(template.body)}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                          <NeonButton type="button" size="sm" onClick={() => setUsingTemplate(template)}>
                            {t('documentTemplates.use')}
                          </NeonButton>
                          <NeonButton type="button" variant="ghost" size="sm" onClick={() => startEdit(template)}>
                            <span className="inline-flex items-center gap-1.5">
                              <IconPencil className="h-3.5 w-3.5" />
                              {t('common.edit')}
                            </span>
                          </NeonButton>
                          <NeonButton type="button" variant="danger" size="sm" onClick={() => handleDelete(template)}>
                            <span className="inline-flex items-center gap-1.5">
                              <IconTrash className="h-3.5 w-3.5" />
                              {t('common.delete')}
                            </span>
                          </NeonButton>
                        </div>
                      </div>
                    </CutFrame>
                  </li>
                )
              })}
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

      <UseDocumentTemplateModal
        open={Boolean(usingTemplate)}
        template={usingTemplate}
        onClose={() => setUsingTemplate(null)}
      />
    </div>
  )
}
