import Modal from '../Modal'
import { BTN_GHOST, BTN_PRIMARY } from '../../theme/designTokens'
import { useTranslation } from '../../i18n/LanguageContext'

export default function PrintOptionsModal({
  open,
  hasHeader,
  onHasHeaderChange,
  confirming = false,
  onConfirm,
  onClose,
}) {
  const { t } = useTranslation()

  function handleClose() {
    if (!confirming) {
      onClose?.()
    }
  }

  return (
    <Modal title={t('print.optionsTitle')} open={open} onClose={handleClose}>
      <p className="text-sm text-slate-300">{t('print.optionsSubtitle')}</p>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={hasHeader}
          onChange={(event) => onHasHeaderChange(event.target.checked)}
          disabled={confirming}
        />
        <span>
          <span className="block text-sm font-medium text-white">{t('print.includeHeader')}</span>
          <span className="mt-1 block text-xs text-slate-400">{t('print.includeHeaderHint')}</span>
        </span>
      </label>

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className={BTN_GHOST} disabled={confirming} onClick={handleClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className={BTN_PRIMARY} disabled={confirming} onClick={onConfirm}>
          {confirming ? t('print.printing') : t('print.print')}
        </button>
      </div>
    </Modal>
  )
}
