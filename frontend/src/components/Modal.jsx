import { useTranslation } from '../i18n/LanguageContext'

export default function Modal({ title, open, onClose, children, panelClassName = '' }) {
  const { t } = useTranslation()

  if (!open) {
    return null
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal flex max-h-[90vh] flex-col overflow-hidden ${panelClassName}`.trim()}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header shrink-0">
          <h2>{title}</h2>
          <button type="button" className="ghost" onClick={onClose}>
            {t('common.close')}
          </button>
        </header>
        <div className="modal-body max-h-[70vh] space-y-4 overflow-y-auto pr-2 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
