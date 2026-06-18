import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import * as clientsApi from '../api/clients'
import * as projectsApi from '../api/projects'
import { useTranslation } from '../i18n/LanguageContext'
import { findNavRoutes, getRecommendedRoutes } from './globalSearchConfig'

function IconSearch({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" strokeLinecap="round" />
    </svg>
  )
}

function IconChevronRight({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconFileText({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 4h8a2 2 0 012 2v12l-3-2-3 2-3-2-3 2V6a2 2 0 012-2z" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" strokeLinecap="round" />
    </svg>
  )
}

function IconUsers({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-2.5 2.5-4 6-4s6 1.5 6 4" strokeLinecap="round" />
      <path d="M16 11h5M18.5 8.5v5" strokeLinecap="round" />
    </svg>
  )
}

function IconBriefcase({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h16v12H4z" strokeLinejoin="round" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" strokeLinecap="round" />
    </svg>
  )
}

function IconLayoutGrid({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconCheckSquare({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

function IconShield({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3l7 3v6c0 4.2-2.8 7.6-7 9-4.2-1.4-7-4.8-7-9V6l7-3z" strokeLinejoin="round" />
    </svg>
  )
}

const ROUTE_ICONS = {
  dashboard: IconLayoutGrid,
  tasks: IconCheckSquare,
  clients: IconUsers,
  projects: IconBriefcase,
  quotes: IconFileText,
  invoices: IconFileText,
  roles: IconShield,
}

const ROW_BASE =
  'command-palette-row flex w-full items-center gap-4 rounded-xl border border-transparent p-3 text-left text-slate-200 transition-colors mb-1.5 cursor-pointer'

const ROW_ACTIVE = 'is-active'

function ResultIcon({ result }) {
  if (result.type === 'client') {
    return <IconUsers className="h-4 w-4 text-slate-300" />
  }

  if (result.type === 'project') {
    return <IconBriefcase className="h-4 w-4 text-slate-300" />
  }

  const Icon = ROUTE_ICONS[result.routeId] ?? IconFileText
  return <Icon className="h-4 w-4 text-slate-300" />
}

export default function GlobalSearch() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const modalRef = useRef(null)

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [entityResults, setEntityResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const recommendedRoutes = useMemo(() => getRecommendedRoutes(t), [t])

  const navResults = useMemo(
    () => findNavRoutes(searchQuery, t),
    [searchQuery, t],
  )

  const queryResults = useMemo(() => {
    const merged = [...navResults, ...entityResults]
    const seen = new Set()

    return merged.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
  }, [entityResults, navResults])

  const hasQuery = searchQuery.trim().length > 0
  const displayResults = hasQuery ? queryResults : recommendedRoutes
  const sectionLabel = hasQuery ? t('globalSearch.suggestions') : t('globalSearch.recommended')

  const closePalette = useCallback(() => {
    setIsOpen(false)
    setSearchQuery('')
    setEntityResults([])
    setActiveIndex(-1)
  }, [])

  const openPalette = useCallback(() => {
    setIsOpen(true)
  }, [])

  useEffect(() => {
    setActiveIndex(displayResults.length > 0 ? 0 : -1)
  }, [displayResults])

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)

    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    function handleGlobalShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleGlobalShortcut)
    return () => window.removeEventListener('keydown', handleGlobalShortcut)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closePalette()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [closePalette, isOpen])

  useEffect(() => {
    const query = searchQuery.trim()
    if (!isOpen || query.length < 2) {
      setEntityResults([])
      setIsSearching(false)
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setIsSearching(true)

      try {
        const [clientsResponse, projectsResponse] = await Promise.all([
          clientsApi.fetchClients({ search: query, page: 1 }),
          projectsApi.fetchProjects({ search: query, page: 1 }),
        ])

        if (cancelled) return

        const clients = (clientsResponse.data ?? []).slice(0, 5).map((client) => ({
          id: `client-${client.id}`,
          type: 'client',
          label: client.name,
          subtitle: client.email ?? client.city ?? t('nav.clients'),
          path: '/clients',
          state: { prefillSearch: client.name },
        }))

        const projects = (projectsResponse.data ?? []).slice(0, 5).map((project) => ({
          id: `project-${project.id}`,
          type: 'project',
          label: project.title,
          subtitle: project.reference,
          path: `/projects/${project.id}`,
        }))

        setEntityResults([...clients, ...projects])
      } catch {
        if (!cancelled) setEntityResults([])
      } finally {
        if (!cancelled) setIsSearching(false)
      }
    }, 280)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [isOpen, searchQuery, t])

  const selectResult = useCallback((result) => {
    navigate(result.path, result.state ? { state: result.state } : undefined)
    closePalette()
  }, [closePalette, navigate])

  function handleInputKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePalette()
      return
    }

    if (displayResults.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % displayResults.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index <= 0 ? displayResults.length - 1 : index - 1))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const target = displayResults[activeIndex] ?? displayResults[0]
      if (target) selectResult(target)
    }
  }

  function resultItemClass(index) {
    return [ROW_BASE, index === activeIndex ? ROW_ACTIVE : ''].join(' ')
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closePalette()
    }
  }

  const paletteModal = isOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[10vh] backdrop-blur-[1px]"
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-xl rounded-2xl border border-slate-700/60 bg-[#1f2937] p-4 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={t('layout.commandSearch')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <IconSearch className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t('layout.commandSearch')}
            aria-label={t('layout.commandSearch')}
            aria-controls="global-search-results"
            aria-activedescendant={
              activeIndex >= 0 ? `global-search-option-${activeIndex}` : undefined
            }
            className="command-palette-input min-w-0 flex-1 border-none bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="ml-auto shrink-0 rounded-md border border-gray-700 px-1.5 py-0.5 font-mono text-xs text-gray-500 shadow-sm">
            Esc
          </kbd>
        </div>

        <div className="my-3 border-t border-slate-700/50" />

        <div id="global-search-results">
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            {sectionLabel}
          </p>

          {hasQuery && displayResults.length === 0 ? (
            <p className="px-2 py-2 text-sm text-slate-500">
              {isSearching ? t('globalSearch.searching') : t('globalSearch.noResults')}
            </p>
          ) : (
            <ul className="max-h-[min(24rem,50vh)] overflow-y-auto px-1">
              {displayResults.map((result, index) => (
                <li key={result.id}>
                  <button
                    id={`global-search-option-${index}`}
                    type="button"
                    aria-selected={index === activeIndex}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectResult(result)}
                    className={resultItemClass(index)}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900/70 ring-1 ring-slate-700/60">
                      <ResultIcon result={result} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-200">{result.label}</span>
                      {result.subtitle ? (
                        <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
                      ) : null}
                    </span>
                    <IconChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        aria-label={t('layout.commandSearch')}
        className="app-header-icon-btn app-header-search-trigger rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
      >
        <IconSearch className="h-5 w-5 shrink-0" />
      </button>

      {paletteModal ? createPortal(paletteModal, document.body) : null}
    </>
  )
}
