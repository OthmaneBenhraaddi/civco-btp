import { useEffect, useRef } from 'react'

/**
 * Run reset() only when a modal/dialog opens — not when other deps (e.g. clients list) change.
 */
export function useWizardResetOnOpen(open, reset) {
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      reset()
    }

    wasOpenRef.current = open
  }, [open, reset])
}
