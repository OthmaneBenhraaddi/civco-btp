import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import * as documentTypesApi from '../../api/documentTypes'
import * as documentsApi from '../../api/documents'
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
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [projectId, statusFilter])

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
      event.target.reset()
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
      {canUpload ? (
        <form className="card stack" onSubmit={handleUpload}>
          <h3>{t('documents.upload')}</h3>
          <label>
            {t('documents.file')}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>
          <label>
            {t('documents.category')}
            {documentTypes.length === 0 ? (
              <p className="hint mt-2">{t('documents.noTypesConfigured')}</p>
            ) : (
              <select
                value={documentTypeId}
                onChange={(event) => setDocumentTypeId(event.target.value)}
                required
              >
                {documentTypes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}
          </label>
          <p className="hint">{t('documents.uploadHint')}</p>
          <button type="submit" disabled={uploading || !file || !documentTypeId || documentTypes.length === 0}>
            {uploading ? t('documents.uploading') : t('documents.uploadButton')}
          </button>
        </form>
      ) : null}

      <div className="toolbar">
        <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="active">{t('documents.filters.active')}</option>
          <option value="archived">{t('documents.filters.archived')}</option>
          <option value="all">{t('documents.filters.all')}</option>
        </select>
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
    </section>
  )
}
