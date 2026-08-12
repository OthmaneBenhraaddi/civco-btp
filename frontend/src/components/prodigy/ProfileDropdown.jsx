import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const MENU_ITEMS = [
  { to: '/', label: 'Dashboard', icon: IconGrid },
  { to: '/projects', label: 'Projects', icon: IconBriefcase },
  { to: '/tickets', label: 'Tickets', icon: IconTicket },
  { to: '/history', label: 'History', icon: IconClock },
  { to: '/roles', label: 'Access', icon: IconShield },
]

export default function ProfileDropdown() {
  const { user, company, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const displayName = user?.full_name || user?.first_name || 'Operator'
  const userId = user?.id ? `76561199${String(100000000 + user.id).slice(-8)}` : '76561199137189635'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={['pg-cut-btn is-compact', open ? 'is-neon' : 'is-ghost'].join(' ')}
      >
        <span className="pg-cut-btn__face !gap-2.5 !px-2 !py-1.5 !normal-case !tracking-normal">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1c2433] text-[11px] font-bold text-white ring-1 ring-white/10">
            {initials}
          </span>
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block truncate text-[12px] font-semibold leading-tight text-white">
              {displayName.split(' ')[0]}
            </span>
            <span className="block truncate text-[10px] font-normal leading-tight tracking-normal text-slate-300">
              {userId}
            </span>
          </span>
          <IconChevron
            className={`h-3.5 w-3.5 text-slate-300 transition ${open ? 'rotate-180 text-[var(--pg-accent)]' : ''}`}
          />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="pg-cut-shell pg-cut-shell--md absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[15.75rem] shadow-2xl shadow-black/55"
        >
          <div className="pg-cut-shell__inner overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[var(--pg-border)] px-4 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c2433] text-xs font-bold text-white ring-1 ring-white/10">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-slate-300">
                  {company?.name || 'Civco BTP Groupe'}
                </p>
              </div>
            </div>

            <ul className="m-0 list-none p-1.5">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="pg-menu-link"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-[var(--pg-border)] p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  logout?.()
                }}
                className="pg-cut-btn is-danger is-compact w-full"
              >
                <span className="pg-cut-btn__face !justify-start !px-3">
                  <IconLogout className="h-4 w-4" />
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function IconChevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" />
    </svg>
  )
}

function IconGrid({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </svg>
  )
}

function IconBriefcase({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  )
}

function IconTicket({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z" />
      <path d="M12 8v8" strokeDasharray="2 2" />
    </svg>
  )
}

function IconShield({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3z" />
    </svg>
  )
}

function IconLogout({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M10 7V5a2 2 0 012-2h7v18h-7a2 2 0 01-2-2v-2" strokeLinecap="round" />
      <path d="M15 12H3m0 0l3-3m-3 3l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClock({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round" />
    </svg>
  )
}
