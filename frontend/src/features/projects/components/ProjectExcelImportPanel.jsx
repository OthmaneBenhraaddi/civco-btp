import { useCallback, useRef, useState } from 'react'
import { FileSpreadsheet, Upload } from 'lucide-react'
import * as projectsApi from '../../../api/projects'
import { useToast } from '../../../context/ToastContext'
import { useTranslation } from '../../../i18n/LanguageContext'
import { BENTO_CARD_CLASS, BTN_GHOST, BTN_PRIMARY } from '../../../theme/designTokens'
import { extractErrorMessage } from '../../../utils/apiHelpers'

function importErrorsFromResponse(error) {
  const payload = error?.response?.data
  if (Array.isArray(payload?.errors)) {
    return payload.errors
  }

  return []
}

export default function ProjectExcelImportPanel({ projectId, projectReference, onImported }) {
  const { t } = useTranslation()
  const { pushToast } = useToast()
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  const downloadTemplate = useCallback(async () => {
    setErrorMessage('')
    setErrors([])
    try {
      await projectsApi.downloadProjectImportTemplate(
        projectId,
        `modele-import-chantier-${projectReference || projectId}.xlsx`,
      )
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, t('projects.planning.import.downloadError')))
    }
  }, [projectId, projectReference, t])

  const importFile = useCallback(async (file) => {
    if (!file) {
      return
    }

    const name = file.name?.toLowerCase() ?? ''
    if (!name.endsWith('.xlsx')) {
      setErrorMessage(t('projects.planning.import.invalidType'))
      setErrors([])
      return
    }

    setBusy(true)
    setProgress(0)
    setErrors([])
    setErrorMessage('')

    try {
      const result = await projectsApi.importProjectExcel(projectId, file, (event) => {
        if (!event.total) {
          return
        }
        setProgress(Math.round((event.loaded / event.total) * 100))
      })
      setProgress(100)
      pushToast({
        action: 'creation',
        message: result.message || t('projects.planning.import.success', {
          count: result.data?.tasks_imported ?? 0,
        }),
      })
      await onImported?.()
    } catch (err) {
      const list = importErrorsFromResponse(err)
      setErrors(list)
      setErrorMessage(extractErrorMessage(err, t('projects.planning.import.error')))
    } finally {
      setBusy(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }, [onImported, projectId, pushToast, t])

  function onDrop(event) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    importFile(file)
  }

  return (
    <section className={`${BENTO_CARD_CLASS} p-5`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{t('projects.planning.import.title')}</h3>
          <p className="mt-1 text-xs text-slate-500">{t('projects.planning.import.subtitle')}</p>
        </div>
        <button type="button" className={BTN_GHOST} onClick={downloadTemplate} disabled={busy}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t('projects.planning.import.download')}
        </button>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border border-dashed px-4 py-6 text-center transition-colors ${
          dragOver
            ? 'border-indigo-400/60 bg-indigo-500/10'
            : 'border-white/[0.08] bg-[#121316]'
        }`}
      >
        <Upload className="mx-auto mb-2 h-5 w-5 text-slate-500" />
        <p className="text-sm text-slate-300">{t('projects.planning.import.dropHint')}</p>
        <p className="mt-1 text-xs text-slate-500">{t('projects.planning.import.fileHint')}</p>
        <button
          type="button"
          className={`${BTN_PRIMARY} mt-4`}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? t('projects.planning.import.importing') : t('projects.planning.import.chooseFile')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => importFile(event.target.files?.[0])}
        />
      </div>

      {busy ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {t('projects.planning.import.progress', { percent: progress })}
          </p>
        </div>
      ) : null}

      {errorMessage ? <p className="mt-3 text-sm text-rose-300">{errorMessage}</p> : null}

      {errors.length > 0 ? (
        <ul className="mt-3 max-h-48 space-y-1 overflow-auto rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-200">
          {errors.map((item, index) => (
            <li key={`${item.row}-${item.column}-${index}`}>
              {item.row > 0
                ? t('projects.planning.import.errorLine', {
                  row: item.row,
                  column: item.column,
                  header: item.header,
                  message: item.message,
                })
                : item.message}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
