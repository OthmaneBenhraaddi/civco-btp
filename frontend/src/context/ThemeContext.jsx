import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as themeColorsApi from '../api/themeColors'
import { useAuth } from './AuthContext'
import { THEME_COLOR_DEFAULTS, getChartPalette } from '../theme/themeColorDefaults'
import { applyThemeColorsToDocument } from '../utils/colorUtils'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { company, isAuthenticated } = useAuth()
  const [colors, setColors] = useState(THEME_COLOR_DEFAULTS)
  const [loading, setLoading] = useState(false)

  const loadColors = useCallback(async () => {
    if (!company?.id) {
      setColors(THEME_COLOR_DEFAULTS)
      applyThemeColorsToDocument(THEME_COLOR_DEFAULTS)
      return
    }

    setLoading(true)

    try {
      const nextColors = await themeColorsApi.fetchThemeColors()
      const merged = { ...THEME_COLOR_DEFAULTS, ...nextColors }
      setColors(merged)
      applyThemeColorsToDocument(merged)
    } catch {
      setColors(THEME_COLOR_DEFAULTS)
      applyThemeColorsToDocument(THEME_COLOR_DEFAULTS)
    } finally {
      setLoading(false)
    }
  }, [company?.id])

  useEffect(() => {
    if (!isAuthenticated) {
      setColors(THEME_COLOR_DEFAULTS)
      applyThemeColorsToDocument(THEME_COLOR_DEFAULTS)
      return
    }

    loadColors()
  }, [isAuthenticated, loadColors])

  const saveColors = useCallback(async (nextColors) => {
    const updated = await themeColorsApi.updateThemeColors(nextColors)
    const merged = { ...THEME_COLOR_DEFAULTS, ...updated }
    setColors(merged)
    applyThemeColorsToDocument(merged)
    return merged
  }, [])

  const chartPalette = useMemo(() => getChartPalette(colors), [colors])

  const value = useMemo(
    () => ({
      colors,
      chartPalette,
      loading,
      reloadColors: loadColors,
      saveColors,
    }),
    [chartPalette, colors, loadColors, loading, saveColors],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}

export function useThemeColor(key, fallback = THEME_COLOR_DEFAULTS[key]) {
  const { colors } = useTheme()
  return colors[key] ?? fallback
}
