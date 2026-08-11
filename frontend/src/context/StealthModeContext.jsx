import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as authApi from '../api/auth'
import { setStealthModeActive } from '../api/client'
import { useAuth } from './AuthContext'
import {
  DEFAULT_STEALTH_SHORTCUT,
  eventMatchesShortcut,
  formatStealthShortcut,
  resolveStealthShortcut,
} from '../utils/stealthShortcut'

export const STEALTH_MODE_CHANGED_EVENT = 'stealth-mode-changed'

const STORAGE_KEY = 'civco_stealth_mode'
const StealthModeContext = createContext(null)

function readInitialStealthMode() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function persistStealthMode(active) {
  try {
    if (active) {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
}

function broadcastStealthModeChanged(active) {
  window.dispatchEvent(
    new CustomEvent(STEALTH_MODE_CHANGED_EVENT, {
      detail: { active },
    }),
  )
}

export function StealthModeProvider({ children }) {
  const { user, refresh } = useAuth()
  const [stealthMode, setStealthModeState] = useState(readInitialStealthMode)
  const [stealthEpoch, setStealthEpoch] = useState(0)
  const [shortcut, setShortcutState] = useState(() => resolveStealthShortcut(null))
  const [shortcutSaving, setShortcutSaving] = useState(false)
  const shortcutRef = useRef(shortcut)
  shortcutRef.current = shortcut

  useEffect(() => {
    setStealthModeActive(stealthMode)
  }, [stealthMode])

  // Each admin has their own shortcut stored on the user record.
  useEffect(() => {
    setShortcutState(resolveStealthShortcut(user?.stealth_shortcut))
  }, [user?.id, user?.stealth_shortcut])

  const applyStealthMode = useCallback((active) => {
    const next = Boolean(active)
    setStealthModeState(next)
    persistStealthMode(next)
    setStealthModeActive(next)
    setStealthEpoch((value) => value + 1)
    broadcastStealthModeChanged(next)
  }, [])

  const setStealthMode = useCallback((next) => {
    applyStealthMode(next)
  }, [applyStealthMode])

  const toggleStealthMode = useCallback(() => {
    setStealthModeState((previous) => {
      const next = !previous
      persistStealthMode(next)
      setStealthModeActive(next)
      setStealthEpoch((value) => value + 1)
      broadcastStealthModeChanged(next)
      return next
    })
  }, [])

  const setStealthShortcut = useCallback(async (nextShortcut) => {
    const normalized = resolveStealthShortcut(nextShortcut)
    setShortcutSaving(true)

    try {
      await authApi.updateProfile({ stealth_shortcut: normalized })
      await refresh()
      setShortcutState(normalized)
      return normalized
    } finally {
      setShortcutSaving(false)
    }
  }, [refresh])

  const resetShortcut = useCallback(async () => {
    setShortcutSaving(true)

    try {
      // null = use platform default (Ctrl+Shift+U) for this admin
      await authApi.updateProfile({ stealth_shortcut: null })
      await refresh()
      const normalized = { ...DEFAULT_STEALTH_SHORTCUT }
      setShortcutState(normalized)
      return normalized
    } finally {
      setShortcutSaving(false)
    }
  }, [refresh])

  useEffect(() => {
    function onKeyDown(event) {
      const target = event.target
      const tag = target?.tagName?.toLowerCase()
      const isTypingField = tag === 'input'
        || tag === 'textarea'
        || tag === 'select'
        || target?.isContentEditable

      if (isTypingField && !target?.dataset?.stealthShortcutCapture) {
        return
      }

      if (!eventMatchesShortcut(event, shortcutRef.current)) {
        return
      }

      event.preventDefault()
      toggleStealthMode()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleStealthMode])

  const shortcutLabel = useMemo(
    () => formatStealthShortcut(shortcut),
    [shortcut],
  )

  const value = useMemo(
    () => ({
      stealthMode,
      stealthEpoch,
      setStealthMode,
      toggleStealthMode,
      stealthShortcut: shortcut,
      stealthShortcutLabel: shortcutLabel,
      setStealthShortcut,
      resetStealthShortcut: resetShortcut,
      shortcutSaving,
      defaultStealthShortcut: DEFAULT_STEALTH_SHORTCUT,
    }),
    [
      stealthMode,
      stealthEpoch,
      setStealthMode,
      toggleStealthMode,
      shortcut,
      shortcutLabel,
      setStealthShortcut,
      resetShortcut,
      shortcutSaving,
    ],
  )

  return <StealthModeContext.Provider value={value}>{children}</StealthModeContext.Provider>
}

export function useStealthMode() {
  const context = useContext(StealthModeContext)
  if (!context) {
    throw new Error('useStealthMode must be used within StealthModeProvider')
  }
  return context
}

/**
 * Re-run `onRefresh` when stealth toggles (skips first mount).
 * Prefer instant local filtering; use this only for silent background reconcile
 * (dashboard counts, etc.). Callback receives `{ active, silent: true }`.
 */
export function useStealthModeRefresh(onRefresh) {
  const { stealthEpoch, stealthMode } = useStealthMode()
  const onRefreshRef = useRef(onRefresh)
  const stealthModeRef = useRef(stealthMode)
  onRefreshRef.current = onRefresh
  stealthModeRef.current = stealthMode

  useEffect(() => {
    if (stealthEpoch === 0) {
      return
    }
    onRefreshRef.current?.({ active: stealthModeRef.current, silent: true })
  }, [stealthEpoch])
}
