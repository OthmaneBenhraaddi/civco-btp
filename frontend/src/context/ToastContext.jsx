import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'
import { ACTION_TOAST_CLASS, TOAST_EVENT } from '../features/history/auditLogStore'

const ToastContext = createContext(null)

const TOAST_LIFETIME_MS = 5200
const MAX_VISIBLE_TOASTS = 4

function ToastIcon({ action }) {
  if (action === 'creation') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    )
  }

  if (action === 'suppression' || action === 'error') {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  )
}

function ToastStack({ toasts, onDismiss }) {
  const { t } = useTranslation()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="action-toast-stack pointer-events-none fixed bottom-5 right-5 z-[120] flex w-[min(100vw-2rem,22rem)] flex-col gap-2.5"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const styles = ACTION_TOAST_CLASS[toast.action] ?? ACTION_TOAST_CLASS.modification

        return (
          <div
            key={toast.id}
            className={[
              'pg-cut-shell pg-cut-shell--sm action-toast pointer-events-auto',
              'animate-[toast-in_0.28s_ease-out]',
              styles.shell,
            ].join(' ')}
            role="status"
          >
            <div className="pg-cut-shell__inner relative bg-[#0e121b]/95 px-4 pb-3.5 pt-3.5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="action-toast-close absolute right-2 top-2 z-[1] grid h-7 w-7 place-items-center text-slate-500 transition hover:bg-white/5 hover:text-white"
                aria-label={t('common.close')}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>

              <div className="flex gap-3 pr-7">
                <span className={['mt-0.5 shrink-0', styles.icon].join(' ')}>
                  <ToastIcon action={toast.action} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={['text-sm font-semibold', styles.title].join(' ')}>
                    {t(`toast.titles.${toast.action}`)}
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-400">{toast.message}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((entry) => {
    const toast = {
      id: entry.id ?? `toast-${Date.now()}`,
      action: entry.action,
      message: entry.message,
    }

    setToasts((current) => [toast, ...current].slice(0, MAX_VISIBLE_TOASTS))

    window.setTimeout(() => {
      dismissToast(toast.id)
    }, TOAST_LIFETIME_MS)
  }, [dismissToast])

  useEffect(() => {
    function handleToast(event) {
      if (event.detail?.message) {
        pushToast(event.detail)
      }
    }

    window.addEventListener(TOAST_EVENT, handleToast)
    return () => window.removeEventListener(TOAST_EVENT, handleToast)
  }, [pushToast])

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return context
}
