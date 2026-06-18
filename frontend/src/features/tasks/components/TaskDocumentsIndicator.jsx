function IconPaperclip({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        d="M16.5 6.5l-6.2 6.2a3 3 0 104.2 4.2l6.8-6.8a5 5 0 10-7.1-7.1L7.3 10.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TaskDocumentsIndicator({ files, docLabel, onOpen }) {
  if (!files.length) {
    return <span className="text-slate-600">—</span>
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(files)}
      className="task-docs-indicator inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-all duration-200 ease-in-out hover:text-blue-400"
      title={files.join(', ')}
    >
      <IconPaperclip className="h-3.5 w-3.5 shrink-0" />
      <span>{docLabel}</span>
    </button>
  )
}
