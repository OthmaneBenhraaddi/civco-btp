export const STEALTH_SHORTCUT_CHANGED_EVENT = 'stealth-shortcut-changed'

/** Default per-admin shortcut when none is stored on the user. */
export const DEFAULT_STEALTH_SHORTCUT = {
  ctrl: true,
  shift: true,
  alt: false,
  meta: false,
  key: 'u',
}

export function normalizeShortcutKey(key) {
  if (!key || typeof key !== 'string') {
    return ''
  }

  const lower = key.toLowerCase()

  if (lower === ' ') {
    return 'space'
  }

  if (lower.length === 1) {
    return lower
  }

  return lower
}

export function isModifierOnlyKey(key) {
  const normalized = normalizeShortcutKey(key)
  return ['control', 'shift', 'alt', 'meta', 'os'].includes(normalized)
}

export function shortcutFromKeyboardEvent(event) {
  const key = normalizeShortcutKey(event.key)

  if (!key || isModifierOnlyKey(key)) {
    return null
  }

  return {
    ctrl: Boolean(event.ctrlKey),
    shift: Boolean(event.shiftKey),
    alt: Boolean(event.altKey),
    meta: Boolean(event.metaKey),
    key,
  }
}

export function eventMatchesShortcut(event, shortcut) {
  if (!shortcut?.key) {
    return false
  }

  return normalizeShortcutKey(event.key) === shortcut.key
    && Boolean(event.ctrlKey) === Boolean(shortcut.ctrl)
    && Boolean(event.shiftKey) === Boolean(shortcut.shift)
    && Boolean(event.altKey) === Boolean(shortcut.alt)
    && Boolean(event.metaKey) === Boolean(shortcut.meta)
}

export function formatStealthShortcut(shortcut, labels = {}) {
  const parts = []

  if (shortcut?.ctrl) {
    parts.push(labels.ctrl ?? 'Ctrl')
  }
  if (shortcut?.shift) {
    parts.push(labels.shift ?? 'Shift')
  }
  if (shortcut?.alt) {
    parts.push(labels.alt ?? 'Alt')
  }
  if (shortcut?.meta) {
    parts.push(labels.meta ?? 'Meta')
  }

  const key = shortcut?.key ? String(shortcut.key).toUpperCase() : '?'
  parts.push(key)

  return parts.join(' + ')
}

/**
 * Resolve the effective shortcut for a user (per-admin preference or default).
 */
export function resolveStealthShortcut(userShortcut) {
  const key = normalizeShortcutKey(userShortcut?.key)

  if (!key || isModifierOnlyKey(key)) {
    return { ...DEFAULT_STEALTH_SHORTCUT }
  }

  const ctrl = Boolean(userShortcut.ctrl)
  const shift = Boolean(userShortcut.shift)
  const alt = Boolean(userShortcut.alt)
  const meta = Boolean(userShortcut.meta)

  if (!ctrl && !shift && !alt && !meta) {
    return { ...DEFAULT_STEALTH_SHORTCUT }
  }

  return {
    ctrl,
    shift,
    alt,
    meta,
    key,
  }
}
