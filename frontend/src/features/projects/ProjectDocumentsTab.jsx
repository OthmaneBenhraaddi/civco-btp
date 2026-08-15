import { useEffect, useRef, useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as documentTemplatesApi from '../../api/documentTemplates'
import * as documentTypesApi from '../../api/documentTypes'
import * as documentsApi from '../../api/documents'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import UseDocumentTemplateModal from '../../components/UseDocumentTemplateModal'
import { BENTO_CARD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage, unwrapResource } from '../../utils/apiHelpers'

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function resolveCategoryLabel(document, t) {
  if (document.category) {
    if (document.type_removed) {
      return `${document.category} (${t('documents.removedType')})`
    }

    return document.category
  }

  return '—'
}

export default function ProjectDocumentsTab({ projectId }) {
  const { hasPermission } = useAuth()
  const { t } = useTranslation()
  const canUpload = hasPermission('document.upload')
  const canArchive = hasPermission('document.archive')

  const [documents, setDocuments] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [statusFilter, setStatusFilter] = useState('active')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [usingTemplate, setUsingTemplate] = useState(null)
  const fileInputRef = useRef(null)

  async function loadDocumentTypes() {
    try {
      const data = await documentTypesApi.fetchDocumentTypes({ active_only: 1 })
      const items = data.data ?? []
      setDocumentTypes(items)
      setDocumentTypeId((current) => current || String(items[0]?.id ?? ''))
    } catch {
      setDocumentTypes([])
    }
  }

  async function loadTemplates() {
    try {
      const list = await documentTemplatesApi.fetchDocumentTemplates()
      const items = Array.isArray(list) ? list : []
      setTemplates(items)
      setSelectedTemplateId((current) => current || String(items[0]?.id ?? ''))
    } catch {
      setTemplates([])
    }
  }

  async function loadDocuments() {
    setLoading(true)
    setError('')

    try {
      const data = await documentsApi.fetchProjectDocuments(projectId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      setDocuments(unwrapResource(data.data ?? data))
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocumentTypes()
    loadTemplates()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [projectId, statusFilter])

  function openGenerateFromTemplate() {
    const template = templates.find((item) => String(item.id) === String(selectedTemplateId))
    if (template) {
      setUsingTemplate(template)
    }
  }
  async function handleUpload(event) {
    event.preventDefault()

    if (!file || !documentTypeId) {
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type_id', documentTypeId)

      await documentsApi.uploadProjectDocument(projectId, formData)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await loadDocuments()
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.uploadError')))
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(document) {
    try {
      await documentsApi.downloadDocument(document.id, document.original_filename)
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.downloadError')))
    }
  }

  async function handleArchive(documentId) {
    if (!window.confirm(t('documents.archiveConfirm'))) {
      return
    }

    setError('')

    try {
      await documentsApi.archiveDocument(documentId)
      await loadDocuments()
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.archiveError')))
    }
  }

  return (
    <section className="stack">
      {templates.length > 0 ? (
        <div className={`${BENTO_CARD_CLASS} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white">
                {t('documentTemplates.generateFromTemplate')}
              </h3>
              <p className="mt-1 text-xs text-[var(--pg-text-dim)]">
                {t('documentTemplates.generateFromTemplateHint')}
              </p>
            </div>
            <div className="flex min-w-[14rem] flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1">
                <span className={LABEL_CLASS}>{t('documentTemplates.name')}</span>
                <CutSelect
                  className="w-full"
                  size="sm"
                  value={selectedTemplateId}
                  onChange={setSelectedTemplateId}
                  options={templates.map((item) => ({
                    value: String(item.id),
                    label: item.name,
                  }))}
                />
              </div>
              <NeonButton
                type="button"
                size="sm"
                disabled={!selectedTemplateId}
                onClick={openGenerateFromTemplate}
              >
                {t('documentTemplates.use')}
              </NeonButton>
            </div>
          </div>
        </div>
      ) : null}

      {canUpload ? (
        <form className={`${BENTO_CARD_CLASS} p-5`} onSubmit={handleUpload}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-white">
                {t('documents.upload')}
              </h3>
              <p className="mt-1 text-xs text-[var(--pg-text-dim)]">{t('documents.uploadHint')}</p>
            </div>
            {documentTypes.length > 0 ? (
              <div className="min-w-[12rem]">
                <span className={LABEL_CLASS}>{t('documents.category')}</span>
                <CutSelect
                  className="w-full"
                  size="sm"
                  value={documentTypeId}
                  onChange={setDocumentTypeId}
                  options={documentTypes.map((item) => ({
                    value: String(item.id),
                    label: item.name,
                  }))}
                />
              </div>
            ) : null}
          </div>

          {documentTypes.length === 0 ? (
            <p className="text-xs text-amber-300">{t('documents.noTypesConfigured')}</p>
          ) : null}

          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              const dropped = event.dataTransfer.files?.[0]
              if (dropped) setFile(dropped)
            }}
            className={`pg-dropzone ${dragOver ? 'is-active' : ''}`}
          >
            <div className="pg-dropzone__face">
              <Upload className="mx-auto mb-2 h-5 w-5 text-[var(--pg-accent)]" />
              <p className="text-sm text-slate-300">{t('documents.dropHint')}</p>
              <p className="mt-1 text-xs text-[var(--pg-text-dim)]">{t('documents.uploadHint')}</p>

              {file ? (
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <FileText className="h-4 w-4" />
                  {file.name} · {formatFileSize(file.size)}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <NeonButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="inline-flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {t('documents.chooseFile')}
                  </span>
                </NeonButton>
                <NeonButton
                  type="submit"
                  size="sm"
                  disabled={uploading || !file || !documentTypeId || documentTypes.length === 0}
                >
                  {uploading ? t('documents.uploading') : t('documents.uploadButton')}
                </NeonButton>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        </form>
      ) : null}

      <div className="toolbar">
        <CutSelect
          size="sm"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'active', label: t('documents.filters.active') },
            { value: 'archived', label: t('documents.filters.archived') },
            { value: 'all', label: t('documents.filters.all') },
          ]}
        />
      </div>

      {error ? <p className="error">{error}</p> : null}

      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('documents.filename')}</th>
                <th>{t('documents.category')}</th>
                <th>{t('documents.size')}</th>
                <th>{t('documents.status')}</th>
                <th>{t('documents.uploadedBy')}</th>
                <th>{t('documents.date')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={7}>{t('documents.empty')}</td></tr>
              ) : (
                documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.original_filename}</td>
                    <td>{resolveCategoryLabel(document, t)}</td>
                    <td>{formatFileSize(document.file_size)}</td>
                    <td>{document.status === 'archived' ? t('documents.archived') : t('documents.active')}</td>
                    <td>{document.uploaded_by?.full_name ?? '—'}</td>
                    <td>{new Date(document.created_at).toLocaleString()}</td>
                    <td className="actions">
                      <button type="button" className="ghost" onClick={() => handleDownload(document)}>
                        {t('documents.download')}
                      </button>
                      {canArchive && document.status === 'active' ? (
                        <button type="button" className="ghost danger" onClick={() => handleArchive(document.id)}>
                          {t('documents.archive')}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <UseDocumentTemplateModal
        open={Boolean(usingTemplate)}
        template={usingTemplate}
        lockedProjectId={projectId}
        onClose={() => setUsingTemplate(null)}
      />
    </section>
  )
}
