import { useEffect, useState } from 'react'
import Modal from './Modal'
import CutSelect from './prodigy/CutSelect'
import NeonButton from './prodigy/NeonButton'
import * as clientsApi from '../api/clients'
import * as documentTemplatesApi from '../api/documentTemplates'
import * as projectsApi from '../api/projects'
import { useTranslation } from '../i18n/LanguageContext'
import { useActionToast } from '../hooks/useActionToast'
import { LABEL_CLASS } from '../theme/designTokens'
import { extractErrorMessage } from '../utils/apiHelpers'

/**
 * Compile a document template against a client/project and let the user
 * preview, copy, or download the filled letter.
 */
export default function UseDocumentTemplateModal({
  open,
  template,
  lockedProjectId = null,
  lockedClientId = null,
  onClose,
}) {
  const { t } = useTranslation()
  const { toastSuccess, toastError } = useActionToast()

  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !template) {
      return undefined
    }

    let cancelled = false

    async function loadMeta() {
      setLoadingMeta(true)
      setError('')
      setPreview('')

      try {
        if (lockedProjectId) {
          const project = await projectsApi.fetchProject(lockedProjectId)
          if (cancelled) return
          setProjectId(String(project.id))
          setClientId(project.client_id != null ? String(project.client_id) : '')
          setClients(
            project.client
              ? [{ id: String(project.client.id), label: project.client.name }]
              : [],
          )
          setProjects([
            {
              id: String(project.id),
              label: project.title ?? project.reference ?? `Projet #${project.id}`,
            },
          ])
          return
        }

        const [clientsResponse, projectsResponse] = await Promise.all([
          clientsApi.fetchClientsForPicker(),
          projectsApi.fetchProjects({ per_page: 100 }),
        ])

        if (cancelled) return

        const clientList = clientsResponse.data ?? clientsResponse ?? []
        setClients(
          (Array.isArray(clientList) ? clientList : []).map((client) => ({
            id: String(client.id),
            label: client.name ?? `Client #${client.id}`,
          })),
        )

        const projectList = projectsResponse.data ?? projectsResponse ?? []
        setProjects(
          (Array.isArray(projectList) ? projectList : []).map((project) => ({
            id: String(project.id),
            label: `${project.reference ?? ''} — ${project.title ?? project.id}`.replace(/^ — /, ''),
            clientId: project.client_id != null ? String(project.client_id) : null,
          })),
        )

        if (lockedClientId) {
          setClientId(String(lockedClientId))
        }
      } catch (err) {
        if (!cancelled) {
          setError(extractErrorMessage(err, t('documentTemplates.useLoadError')))
        }
      } finally {
        if (!cancelled) setLoadingMeta(false)
      }
    }

    setClientId(lockedClientId ? String(lockedClientId) : '')
    setProjectId(lockedProjectId ? String(lockedProjectId) : '')
    loadMeta()

    return () => {
      cancelled = true
    }
  }, [open, template, lockedProjectId, lockedClientId, t])

  const filteredProjects = lockedProjectId
    ? projects
    : projects.filter((project) => !clientId || project.clientId === clientId)

  async function handlePreview() {
    if (!template?.id) return
    if (!clientId && !projectId) {
      setError(t('documentTemplates.useNeedContext'))
      return
    }

    setPreviewing(true)
    setError('')

    try {
      const params = {}
      if (clientId) params.client_id = Number(clientId)
      if (projectId) params.project_id = Number(projectId)

      const result = await documentTemplatesApi.previewDocumentTemplate(template.id, params)
      setPreview(result.content ?? '')
    } catch (err) {
      setPreview('')
      setError(extractErrorMessage(err, t('documentTemplates.previewError')))
    } finally {
      setPreviewing(false)
    }
  }

  async function handleCopy() {
    if (!preview) return
    try {
      await navigator.clipboard.writeText(preview)
      toastSuccess(t('documentTemplates.copied'))
    } catch {
      toastError(t('documentTemplates.copyError'))
    }
  }

  function handleDownload() {
    if (!preview) return
    const blob = new Blob([preview], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeName = String(template?.name ?? 'document')
      .replace(/[^\w\-]+/g, '_')
      .slice(0, 60)
    link.href = url
    link.download = `${safeName}.txt`
    link.click()
    URL.revokeObjectURL(url)
    toastSuccess(t('documentTemplates.downloaded'))
  }

  function handleClientChange(nextClientId) {
    setClientId(nextClientId)
    setPreview('')
    if (projectId) {
      const selected = projects.find((project) => project.id === projectId)
      if (selected && nextClientId && selected.clientId !== nextClientId) {
        setProjectId('')
      }
    }
  }

  function handleProjectChange(nextProjectId) {
    setProjectId(nextProjectId)
    setPreview('')
    const selected = projects.find((project) => project.id === nextProjectId)
    if (selected?.clientId) {
      setClientId(selected.clientId)
    }
  }

  if (!template) {
    return null
  }

  return (
    <Modal
      title={t('documentTemplates.useTitle', { name: template.name })}
      open={open}
      onClose={onClose}
      panelClassName="max-w-2xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-400">{t('documentTemplates.useSubtitle')}</p>

        {error ? (
          <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <label className={LABEL_CLASS}>
          {t('documentTemplates.useClient')}
          <CutSelect
            className="w-full"
            size="sm"
            value={clientId}
            onChange={handleClientChange}
            disabled={loadingMeta || Boolean(lockedProjectId) || Boolean(lockedClientId)}
            placeholder={loadingMeta ? t('common.loading') : t('documentTemplates.useClientPlaceholder')}
            options={[
              { value: '', label: t('documentTemplates.useClientPlaceholder') },
              ...clients.map((client) => ({ value: client.id, label: client.label })),
            ]}
          />
        </label>

        <label className={LABEL_CLASS}>
          {t('documentTemplates.useProject')}
          <span className="ml-1 font-medium normal-case tracking-normal text-slate-500">
            ({t('documentTemplates.optional')})
          </span>
          <CutSelect
            className="w-full"
            size="sm"
            value={projectId}
            onChange={handleProjectChange}
            disabled={loadingMeta || Boolean(lockedProjectId) || (!lockedProjectId && filteredProjects.length === 0)}
            placeholder={
              loadingMeta
                ? t('common.loading')
                : t('documentTemplates.useProjectPlaceholder')
            }
            options={[
              { value: '', label: t('documentTemplates.useProjectPlaceholder') },
              ...filteredProjects.map((project) => ({ value: project.id, label: project.label })),
            ]}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <NeonButton
            type="button"
            size="sm"
            onClick={handlePreview}
            disabled={previewing || loadingMeta || (!clientId && !projectId)}
            className={previewing || (!clientId && !projectId) ? 'opacity-45' : ''}
          >
            {previewing ? t('common.loading') : t('documentTemplates.preview')}
          </NeonButton>
          {preview ? (
            <>
              <NeonButton type="button" variant="ghost" size="sm" onClick={handleCopy}>
                {t('documentTemplates.copy')}
              </NeonButton>
              <NeonButton type="button" variant="neon" size="sm" onClick={handleDownload}>
                {t('documentTemplates.download')}
              </NeonButton>
            </>
          ) : null}
        </div>

        {preview ? (
          <div className="max-h-[min(22rem,50vh)] overflow-y-auto rounded-lg border border-white/[0.08] bg-[#0a0f18] px-4 py-3">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">
              {preview}
            </pre>
          </div>
        ) : (
          <p className="text-xs text-slate-500">{t('documentTemplates.previewHint')}</p>
        )}

        <div className="flex justify-end">
          <NeonButton type="button" variant="neon" size="sm" onClick={onClose}>
            {t('common.close')}
          </NeonButton>
        </div>
      </div>
    </Modal>
  )
}
