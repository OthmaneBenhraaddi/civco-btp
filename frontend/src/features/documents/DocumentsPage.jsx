import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload } from 'lucide-react'
import CutSelect from '../../components/prodigy/CutSelect'
import NeonButton from '../../components/prodigy/NeonButton'
import { useAuth } from '../../context/AuthContext'
import { useStealthModeRefresh } from '../../context/StealthModeContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as documentTypesApi from '../../api/documentTypes'
import * as documentsApi from '../../api/documents'
import * as projectsApi from '../../api/projects'
import { BENTO_CARD_CLASS, LABEL_CLASS } from '../../theme/designTokens'
import { extractErrorMessage } from '../../utils/apiHelpers'

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const { hasPermission } = useAuth()
  const { t } = useTranslation()
  const canUpload = hasPermission('document.upload')
  const canArchive = hasPermission('document.archive')

  const [documents, setDocuments] = useState([])
  const [projects, setProjects] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [projectId, setProjectId] = useState('')
  const [documentTypeId, setDocumentTypeId] = useState('')
  const [file, setFile] = useState(null)
  const [statusFilter, setStatusFilter] = useState('active')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  async function loadProjects() {
    try {
      const data = await projectsApi.fetchProjects({ per_page: 100 })
      setProjects(data.data ?? [])
    } catch {
      setProjects([])
    }
  }

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

  async function loadDocuments() {
    setLoading(true)
    setError('')
    try {
      const data = await documentsApi.fetchDocuments({
        status: statusFilter === 'all' ? undefined : statusFilter,
        per_page: 50,
      })
      setDocuments(data.data ?? [])
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.loadError')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
    loadDocumentTypes()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [statusFilter])

  useStealthModeRefresh(() => {
    loadProjects()
    loadDocuments()
  })

  async function handleUpload(event) {
    event.preventDefault()
    if (!file || !documentTypeId) return

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type_id', documentTypeId)
      if (projectId) formData.append('project_id', projectId)
      await documentsApi.uploadDocument(formData)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadDocuments()
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.uploadError')))
    } finally {
      setUploading(false)
    }
  }

  async function handleAssign(documentId, nextProjectId) {
    if (!nextProjectId) return
    setError('')
    try {
      await documentsApi.assignDocumentProject(documentId, Number(nextProjectId))
      await loadDocuments()
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.assignError')))
    }
  }

  async function handlePreview(documentId) {
    try {
      await documentsApi.previewDocument(documentId)
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.previewError')))
    }
  }

  async function handleDownload(document) {
    try {
      await documentsApi.downloadDocument(document.id, document.original_filename)
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.downloadError')))
    }
  }

  async function handleDelete(documentId) {
    if (!window.confirm(t('documents.deleteConfirm'))) return
    setError('')
    try {
      await documentsApi.deleteDocument(documentId)
      await loadDocuments()
    } catch (err) {
      setError(extractErrorMessage(err, t('documents.deleteError')))
    }
  }

  const projectOptions = [
    { value: '', label: t('documents.projectOptional') },
    ...projects.map((project) => ({
      value: String(project.id),
      label: project.reference ? `${project.reference} — ${project.title}` : project.title,
    })),
  ]

  return (
    <div className="list-page">
      <header className="page-header">
        <div>
          <h1>{t('documents.title')}</h1>
          <p>{t('documents.subtitle')}</p>
        </div>
      </header>

      {canUpload ? (
        <form className={`${BENTO_CARD_CLASS} mb-4 p-5`} onSubmit={handleUpload}>
          <div className="mb-4 grid gap-4 sm:grid-cols-2">
            <label>
              <span className={LABEL_CLASS}>{t('documents.project')}</span>
              <CutSelect
                className="w-full"
                size="sm"
                value={projectId}
                onChange={setProjectId}
                options={projectOptions}
              />
            </label>
            <label>
              <span className={LABEL_CLASS}>{t('documents.category')}</span>
              <CutSelect
                className="w-full"
                size="sm"
                value={documentTypeId}
                onChange={setDocumentTypeId}
                disabled={documentTypes.length === 0}
                options={documentTypes.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
              />
            </label>
          </div>

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
              {file ? (
                <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <FileText className="h-4 w-4" />
                  {file.name} · {formatFileSize(file.size)}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <NeonButton type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {t('documents.chooseFile')}
                </NeonButton>
                <NeonButton type="submit" size="sm" disabled={uploading || !file || !documentTypeId}>
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

      {loading ? <p>{t('common.loading')}</p> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('documents.filename')}</th>
                <th>{t('documents.project')}</th>
                <th>{t('documents.category')}</th>
                <th>{t('documents.size')}</th>
                <th>{t('documents.uploadedBy')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr><td colSpan={6}>{t('documents.empty')}</td></tr>
              ) : documents.map((document) => (
                <tr key={document.id}>
                  <td>{document.original_filename}</td>
                  <td>
                    {document.project?.id ? (
                      <Link to={`/projects/${document.project.id}`}>{document.project.title || document.project.reference}</Link>
                    ) : canUpload ? (
                      <CutSelect
                        size="sm"
                        value=""
                        onChange={(value) => handleAssign(document.id, value)}
                        placeholder={t('documents.unassigned')}
                        options={[
                          { value: '', label: t('documents.unassigned') },
                          ...projects.map((project) => ({
                            value: String(project.id),
                            label: project.title,
                          })),
                        ]}
                      />
                    ) : t('documents.unassigned')}
                  </td>
                  <td>{document.category || '—'}</td>
                  <td>{formatFileSize(document.file_size)}</td>
                  <td>{document.uploaded_by?.full_name ?? '—'}</td>
                  <td className="actions">
                    <button type="button" className="ghost" onClick={() => handlePreview(document.id)}>
                      {t('documents.view')}
                    </button>
                    <button type="button" className="ghost" onClick={() => handleDownload(document)}>
                      {t('documents.download')}
                    </button>
                    {canArchive ? (
                      <button type="button" className="ghost danger" onClick={() => handleDelete(document.id)}>
                        {t('documents.delete')}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
