import { useEffect, useRef } from 'react'

/** Background sync interval for dashboard / list views (live-feed feel). */
export const LIVE_SYNC_INTERVAL_MS = 8000

/**
 * Polls a fetch callback on an interval and when the window regains focus.
 * Pass `{ silent: true }` from the hook on background ticks so callers can skip spinners.
 */
export function useAutoRefresh(callback, deps = [], intervalOrOptions = LIVE_SYNC_INTERVAL_MS) {
  const options = typeof intervalOrOptions === 'number'
    ? { intervalMs: intervalOrOptions }
    : { intervalMs: LIVE_SYNC_INTERVAL_MS, ...intervalOrOptions }

  const { intervalMs, runOnMount = true } = options
  const callbackRef = useRef(callback)
  const inFlightRef = useRef(false)

  callbackRef.current = callback

  useEffect(() => {
    let cancelled = false

    async function run({ silent = false } = {}) {
      if (cancelled || inFlightRef.current) {
        return
      }

      inFlightRef.current = true

      try {
        await callbackRef.current({ silent })
      } finally {
        inFlightRef.current = false
      }
    }

    if (runOnMount) {
      run({ silent: false })
    }

    const intervalId = window.setInterval(() => {
      run({ silent: true })
    }, intervalMs)

    function handleFocus() {
      run({ silent: true })
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, deps)
}
