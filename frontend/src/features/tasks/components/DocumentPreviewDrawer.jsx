import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '../../../i18n/LanguageContext'
import { resolveTaskFile } from '../utils/taskFiles'

function IconClose({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

function IconExternal({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M14 5h5v5M10 14L19 5M15 5h4v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9v10h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconDocument({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 4h6l4 4v12H8V4z" strokeLinejoin="round" />
      <path d="M14 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PreviewBody({ file, t }) {
  if (file.kind === 'pdf' && file.url) {
    return (
      <iframe
        title={file.name}
        src={file.url}
        className="h-full w-full border-0 bg-[#0a0b0d]"
      />
    )
  }

  if (file.kind === 'image' && file.url) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-[#0a0b0d] p-4">
        <img
          src={file.url}
          alt={file.name}
          className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
        />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#0a0b0d] px-6 text-center">
      <IconDocument className="h-10 w-10 text-slate-700" />
      <p className="max-w-sm text-sm text-slate-400">{t('tasks.preview.unsupported')}</p>
      <p className="text-xs uppercase tracking-wide text-slate-600">.{file.ext}</p>
    </div>
  )
}

export default function DocumentPreviewDrawer({ open, onClose, files = [], initialIndex = 0 }) {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(initialIndex)

  useEffect(() => {
    if (open) {
      setActiveIndex(initialIndex)
    }
  }, [open, initialIndex])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open || files.length === 0) {
    return null
  }

  const activeFile = resolveTaskFile(files[activeIndex] ?? files[0])
  const previewUrl = activeFile.url

  return createPortal(
    <div
      className="document-preview-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px] transition-all duration-200 ease-in-out"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="document-preview-panel flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#141519] shadow-2xl transition-all duration-200 ease-in-out"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('tasks.preview.title')}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800/80 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {t('tasks.preview.title')}
            </p>
            <h2 className="mt-1 truncate text-sm font-semibold text-white">{activeFile.name}</h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {previewUrl ? (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="document-preview-link inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition-colors duration-200 hover:text-blue-400"
              >
                <IconExternal className="h-3.5 w-3.5" />
                {t('tasks.preview.openInNewTab')}
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="document-preview-close rounded-lg p-1.5 text-slate-400 transition-colors duration-200 hover:bg-white/[0.05] hover:text-white"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        </header>

        {files.length > 1 ? (
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800/60 px-4 py-2">
            {files.map((fileName, index) => {
              const isActive = index === activeIndex

              return (
                <button
                  key={fileName}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={[
                    'document-preview-file-tab shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200',
                  ].join(' ')}
                >
                  {fileName}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-hidden">
          <PreviewBody file={activeFile} t={t} />
        </div>
      </div>
    </div>,
    document.body,
  )
}
