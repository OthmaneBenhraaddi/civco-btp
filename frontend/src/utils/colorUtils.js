export function hexToRgba(hex, alpha) {
  const normalized = (hex ?? '#64748B').replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function hexToRgbString(hex) {
  const normalized = (hex ?? '#64748B').replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)

  return `${r}, ${g}, ${b}`
}

export function buildToneBadgeStyle(color) {
  return {
    backgroundColor: hexToRgba(color, 0.12),
    color,
    borderColor: hexToRgba(color, 0.28),
    boxShadow: `inset 0 0 0 1px ${hexToRgba(color, 0.2)}`,
  }
}

export function applyThemeColorsToDocument(colors) {
  if (!colors || typeof document === 'undefined') {
    return
  }

  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--theme-${key.replace(/_/g, '-')}`, value)
  })
}
