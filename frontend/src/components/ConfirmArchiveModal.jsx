import { BTN_GHOST, BTN_PRIMARY } from '../theme/designTokens'
import Modal from './Modal'

export default function ConfirmArchiveModal({
  open,
  title,
  message,
  confirming = false,
  confirmLabel,
  cancelLabel,
  confirmingLabel = '…',
  onConfirm,
  onClose,
}) {
  function handleClose() {
    if (!confirming) {
      onClose?.()
    }
  }

  return (
    <Modal title={title} open={open} onClose={handleClose}>
      <p className="text-sm leading-relaxed text-slate-300">{message}</p>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          className={BTN_GHOST}
          disabled={confirming}
          onClick={handleClose}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`${BTN_PRIMARY} !bg-amber-600 hover:!bg-amber-500`}
          disabled={confirming}
          onClick={onConfirm}
        >
          {confirming ? confirmingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
