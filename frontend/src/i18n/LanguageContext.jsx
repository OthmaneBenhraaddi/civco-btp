import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './locales/en'
import fr from './locales/fr'

export const DEFAULT_LOCALE = 'fr'
const STORAGE_KEY = 'btp-locale'
const dictionaries = { fr, en }

const LanguageContext = createContext(null)

function getNestedValue(object, path) {
  return path.split('.').reduce((current, key) => current?.[key], object)
}

function interpolate(template, vars = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

function resolveInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'fr') {
      return stored
    }
  } catch {
    // ignore storage access errors
  }

  return DEFAULT_LOCALE
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(resolveInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // ignore storage write errors
    }
  }, [locale])

  const setLocale = useCallback((nextLocale) => {
    if (nextLocale !== 'en' && nextLocale !== 'fr') {
      return
    }
    setLocaleState(nextLocale)
  }, [])

  const t = useCallback((key, vars) => {
    const dictionary = dictionaries[locale] ?? fr
    const value = getNestedValue(dictionary, key) ?? getNestedValue(fr, key) ?? getNestedValue(en, key) ?? key
    return typeof value === 'string' ? interpolate(value, vars) : key
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider')
  }

  return context
}
