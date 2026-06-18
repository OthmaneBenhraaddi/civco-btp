import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n/LanguageContext'

const HEADER_DROPDOWN_PANEL =
  'absolute right-0 top-full z-50 mt-2.5 overflow-hidden rounded-lg border border-slate-700/50 bg-[#141519] shadow-2xl shadow-black/60'

const LOCALES = [
  { value: 'fr', labelKey: 'language.fr' },
  { value: 'en', labelKey: 'language.en' },
]

export default function LanguageSwitcher({ variant = 'default' }) {
  const { locale, setLocale, t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const isAuth = variant === 'auth'
  const isHeader = variant === 'header'
  const current = LOCALES.find((item) => item.value === locale) ?? LOCALES[0]

  useEffect(() => {
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function selectLocale(value) {
    setLocale(value)
    setOpen(false)
  }

  function optionClasses(isActive) {
    const base = [
      'language-switcher-option',
      'block w-full border-0 bg-transparent px-3 py-2 text-left text-xs shadow-none outline-none',
      'transition-colors duration-150 ease-in-out',
      'focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/20',
    ]

    if (isActive) {
      base.push(
        isHeader
          ? 'bg-white/[0.04] font-medium text-slate-200'
          : 'border-l-2 border-blue-500 pl-2 font-medium text-blue-400',
      )
    } else {
      base.push(
        isHeader
          ? 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
          : 'text-slate-400 hover:bg-white/[0.05] hover:text-white',
      )
    }

    return base.join(' ')
  }

  const triggerClasses = isHeader
    ? [
        'language-switcher-trigger-header',
        'inline-flex items-center gap-1.5 rounded-lg p-2 text-sm font-medium text-slate-400',
        'transition-colors hover:bg-white/[0.04] hover:text-white',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20',
      ].join(' ')
    : [
        'language-switcher-trigger',
        'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium',
        'border-slate-800/60 bg-slate-800/40 text-slate-200',
        'transition-colors duration-200 ease-in-out',
        'hover:border-slate-700/80 hover:bg-slate-800/60',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-600/60',
      ].join(' ')

  if (isHeader) {
    return (
      <div ref={rootRef} className="language-switcher-header relative flex h-full items-center">
        <button
          type="button"
          className={triggerClasses}
          aria-expanded={open}
          aria-controls="language-switcher-options-header"
          onClick={() => setOpen((value) => !value)}
        >
          <span>{t(current.labelKey)}</span>
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {open ? (
          <ul
            id="language-switcher-options-header"
            className={`${HEADER_DROPDOWN_PANEL} min-w-[9rem] list-none p-1`}
            role="listbox"
            aria-label={t('language.label')}
          >
            {LOCALES.map((item) => {
              const isActive = locale === item.value

              return (
                <li key={item.value} className="m-0 list-none p-0" role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    className={optionClasses(isActive)}
                    onClick={() => selectLocale(item.value)}
                  >
                    {t(item.labelKey)}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={isAuth ? 'language-switcher w-full text-right text-xs' : 'language-switcher w-full'}
    >
      <span
        className={
          isAuth
            ? 'mb-1.5 block font-medium uppercase tracking-wide text-slate-500'
            : 'language-switcher-label mb-1.5 block'
        }
      >
        {t('language.label')}
      </span>

      <button
        type="button"
        className={triggerClasses}
        aria-expanded={open}
        aria-controls="language-switcher-options"
        onClick={() => setOpen((value) => !value)}
      >
        <span>{t(current.labelKey)}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open ? (
        <ul
          id="language-switcher-options"
          className="language-switcher-options mt-1 flex w-full list-none flex-col gap-y-0.5 rounded-lg border border-slate-800/80 bg-[#1a1b20] p-1"
          role="listbox"
          aria-label={t('language.label')}
        >
          {LOCALES.map((item) => {
            const isActive = locale === item.value

            return (
              <li key={item.value} className="m-0 list-none p-0" role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={optionClasses(isActive)}
                  onClick={() => selectLocale(item.value)}
                >
                  {t(item.labelKey)}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
