import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './locales/en'
import fr from './locales/fr'

const locales = { en, fr }

const LanguageContext = createContext(null)

function getNestedValue(object, path) {
  return path.split('.').reduce((current, key) => current?.[key], object)
}

function interpolate(template, vars = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('locale') || 'fr')

  useEffect(() => {
    localStorage.setItem('locale', locale)
    document.documentElement.lang = locale
  }, [locale])

  const t = useCallback(
    (key, vars) => {
      const value = getNestedValue(locales[locale], key) ?? getNestedValue(locales.en, key) ?? key
      return typeof value === 'string' ? interpolate(value, vars) : key
    },
    [locale],
  )

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, t],
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
