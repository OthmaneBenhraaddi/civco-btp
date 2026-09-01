import { useCallback, useEffect, useState } from 'react'
import * as contractsApi from '../../api/contracts'
import * as projectsApi from '../../api/projects'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useTranslation } from '../../i18n/LanguageContext'
import {
  BENTO_CARD_CLASS,
  FIELD_CLASS,
  LABEL_CLASS,
} from '../../theme/designTokens'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'
import { sanitizeHtml } from '../../utils/sanitizeHtml'
import { SignatureCanvasPadSubmit } from '../client-portal/components/SignatureCanvasPad'

const PLACEHOLDERS = [
  '{client_name}',
  '{client_email}',
  '{project_title}',
  '{project_reference}',
  '{project_city}',
  '{project_budget}',
  '{tenant_name}',
  '{tenant_logo}',
  '{company_name}',
  '{company_address}',
  '{date}',
  '{date_short}',
]

const EMPTY_FORM = { title: '', content: '' }

export default function ContractTemplateSettingsPanel() {
  const { t } = useTranslation()
  const [templates, setTemplates] = useState([])
  const [contracts, setContracts] = useState([])
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [previewProjectId, setPreviewProjectId] = useState('')
  const [compileProjectId, setCompileProjectId] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [signingContractId, setSigningContractId] = useState(null)
  const [tenantSignature, setTenantSignature] = useState(null)
  const [signing, setSigning] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [templatesData, contractsData] = await Promise.all([
        contractsApi.fetchContractTemplates(),
        contractsApi.fetchContracts({ per_page: 20 }),
      ])

      setTemplates(templatesData)
      setContracts(unwrapResource(contractsData))
    } catch (err) {
      setError(extractErrorMessage(err, t('contracts.loadError')))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadProjectsIfNeeded = useCallback(async () => {
    if (projects.length > 0) {
      return
    }

    try {
      const projectsData = await projectsApi.fetchProjects({ per_page: 100 })
      setProjects(unwrapResource(projectsData))
    } catch {
      // Preview/compile dropdowns stay empty if this fails.
    }
  }, [projects.length])

  useEffect(() => {
    loadData()
  }, [loadData])

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setPreviewHtml('')
  }

  function startEdit(template) {
    setEditingId(template.id)
    setForm({ title: template.title, content: template.content })
    setPreviewHtml('')
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingId) {
        await contractsApi.updateContractTemplate(editingId, form)
        setSuccess(t('contracts.templateUpdated'))
      } else {
        await contractsApi.createContractTemplate(form)
        setSuccess(t('contracts.templateCreated'))
      }

      resetForm()
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('contracts.saveError')))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('contracts.confirmDelete'))) {
      return
    }

    try {
      await contractsApi.deleteContractTemplate(id)
      if (editingId === id) {
        resetForm()
      }
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('contracts.deleteError')))
    }
  }

  async function handlePreview() {
    if (!editingId) {
      return
    }

    try {
      const result = await contractsApi.previewContractTemplate(
        editingId,
        previewProjectId ? Number(previewProjectId) : null,
      )
      setPreviewHtml(result.content)
    } catch (err) {
      setError(extractErrorMessage(err, t('contracts.previewError')))
    }
  }

  async function handleCompile(templateId) {
    if (!compileProjectId) {
      setError(t('contracts.selectProject'))
      return
    }

    try {
      await contractsApi.compileContract({
        contract_template_id: templateId,
        project_id: Number(compileProjectId),
      })
      setSuccess(t('contracts.compiled'))
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('contracts.compileError')))
    }
  }

  async function handleTenantSign(contractId) {
    if (!tenantSignature) {
      setError(t('contracts.signatureRequired'))
      return
    }

    setSigning(true)
    setError('')

    try {
      await contractsApi.submitTenantSignature(contractId, tenantSignature)
      setSigningContractId(null)
      setTenantSignature(null)
      setSuccess(t('contracts.tenantSignSuccess'))
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err, t('contracts.signError')))
    } finally {
      setSigning(false)
    }
  }

  const pendingTenantContracts = contracts.filter(
    (contract) => contract.status === 'signed_by_client',
  )

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{success}</p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className={`${BENTO_CARD_CLASS} p-6`}>
          <h2 className="text-lg font-semibold text-white">
            {editingId ? t('contracts.editTemplate') : t('contracts.newTemplate')}
          </h2>

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <label className="block">
              <span className={LABEL_CLASS}>{t('contracts.templateTitle')}</span>
              <input
                className={FIELD_CLASS}
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                required
                placeholder={t('contracts.templateTitlePlaceholder')}
              />
            </label>

            <label className="block">
              <span className={LABEL_CLASS}>{t('contracts.templateContent')}</span>
              <textarea
                className={`${FIELD_CLASS} min-h-[280px] font-mono text-xs leading-relaxed`}
                value={form.content}
                onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))}
                required
              />
            </label>

            <div className="pg-inner-tile p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                {t('contracts.placeholders')}
              </p>
              <div className="flex flex-wrap gap-2">
                {PLACEHOLDERS.map((token) => (
                  <code
                    key={token}
                    className="cursor-pointer bg-white/[0.06] px-2 py-1 text-[11px] text-[var(--pg-accent)]"
                    onClick={() => setForm((current) => ({
                      ...current,
                      content: `${current.content}${token}`,
                    }))}
                  >
                    {token}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <NeonButton
                type="submit"
                size="sm"
                disabled={saving}
                className={saving ? 'opacity-45' : ''}
              >
                {saving ? t('common.saving') : t('common.save')}
              </NeonButton>
              {editingId ? (
                <>
                  <NeonButton type="button" variant="neon" size="sm" onClick={handlePreview}>
                    {t('contracts.preview')}
                  </NeonButton>
                  <NeonButton type="button" variant="ghost" size="sm" onClick={resetForm}>
                    {t('common.cancel')}
                  </NeonButton>
                </>
              ) : null}
            </div>

            {editingId ? (
              <label className="block">
                <span className={LABEL_CLASS}>{t('contracts.previewProject')}</span>
                <div onFocus={loadProjectsIfNeeded} onMouseDown={loadProjectsIfNeeded}>
                  <CutSelect
                    className="w-full"
                    size="sm"
                    value={previewProjectId}
                    onChange={setPreviewProjectId}
                    placeholder={t('contracts.noProjectPreview')}
                    options={[
                      { value: '', label: t('contracts.noProjectPreview') },
                      ...projects.map((project) => ({
                        value: project.id,
                        label: `${project.reference} — ${project.title}`,
                      })),
                    ]}
                  />
                </div>
              </label>
            ) : null}
          </form>

          {previewHtml ? (
            <div
              className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-white/[0.06] bg-white p-4 text-sm text-slate-800"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(previewHtml) }}
            />
          ) : null}
        </section>

        <section className={`${BENTO_CARD_CLASS} p-6`}>
          <h2 className="text-lg font-semibold text-white">{t('contracts.existingTemplates')}</h2>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">{t('common.loading')}</p>
          ) : templates.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t('contracts.noTemplates')}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {templates.map((template) => (
                <li
                  key={template.id}
                  className="pg-inner-tile p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{template.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {template.content.replace(/<[^>]+>/g, ' ').slice(0, 120)}…
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <NeonButton type="button" variant="ghost" size="sm" onClick={() => startEdit(template)}>
                        {t('common.edit')}
                      </NeonButton>
                      <NeonButton type="button" variant="danger" size="sm" onClick={() => handleDelete(template.id)}>
                        {t('common.delete')}
                      </NeonButton>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div onFocus={loadProjectsIfNeeded} onMouseDown={loadProjectsIfNeeded}>
                      <CutSelect
                        className="min-w-[10rem]"
                        size="sm"
                        value={compileProjectId}
                        onChange={setCompileProjectId}
                        placeholder={t('contracts.selectProject')}
                        options={[
                          { value: '', label: t('contracts.selectProject') },
                          ...projects.map((project) => ({
                            value: project.id,
                            label: project.reference,
                          })),
                        ]}
                      />
                    </div>
                    <NeonButton type="button" size="sm" onClick={() => handleCompile(template.id)}>
                      {t('contracts.generate')}
                    </NeonButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={`${BENTO_CARD_CLASS} p-6`}>
        <h2 className="text-lg font-semibold text-white">{t('contracts.pendingTenantSign')}</h2>
        <p className="mt-1 text-sm text-slate-400">{t('contracts.pendingTenantSignHint')}</p>

        {pendingTenantContracts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">{t('contracts.noPendingContracts')}</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {pendingTenantContracts.map((contract) => (
              <li
                key={contract.id}
                className="pg-inner-tile p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{contract.title}</p>
                    <p className="text-xs text-slate-500">
                      {contract.project?.reference} · {contract.client?.name}
                    </p>
                  </div>
                  <NeonButton
                    type="button"
                    size="sm"
                    onClick={() => setSigningContractId(
                      signingContractId === contract.id ? null : contract.id,
                    )}
                  >
                    {t('contracts.counterSign')}
                  </NeonButton>
                </div>

                {signingContractId === contract.id ? (
                  <div className="mt-4 border-t border-white/[0.06] pt-4">
                    <SignatureCanvasPadSubmit
                      disabled={signing}
                      onChange={setTenantSignature}
                      clearLabel={t('contracts.clearSignature')}
                      submitLabel={t('contracts.submitTenantSignature')}
                      submitting={signing}
                      onSubmit={() => handleTenantSign(contract.id)}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
