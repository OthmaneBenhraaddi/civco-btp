import { useEffect, useRef, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import NeonButton from './NeonButton'
import ProfileDropdown from './ProfileDropdown'

const PRIMARY_LINKS = [
  { to: '/', end: true, label: 'Home' },
  { to: '/projects', label: 'Projects' },
  { to: '/clients', label: 'Clients' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/tickets', label: 'Tickets' },
]

const MORE_LINKS = [
  { to: '/quotes', label: 'Quotes' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/roles', label: 'Roles' },
  { to: '/history', label: 'History' },
]

export default function ProdigyNavbar() {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)

  useEffect(() => {
    function onPointerDown(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0b0f17]/90 backdrop-blur-xl">
      <div className="mx-auto grid h-[4.5rem] max-w-[1180px] grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5 justify-self-start">
          <IconMark className="h-7 w-7 text-[var(--pg-accent)] transition group-hover:drop-shadow-[0_0_10px_var(--pg-accent-glow)]" />
          <span className="leading-none">
            <span className="pg-brand block text-[15px] sm:text-base">Civco</span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.28em] text-white/90">
              Btp
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {PRIMARY_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `pg-nav-link ${isActive ? 'is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}

          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              className={`pg-nav-link ${moreOpen ? 'is-active text-white' : ''}`}
              aria-expanded={moreOpen}
            >
              More
              <IconChevron className={`h-3 w-3 transition ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen ? (
              <div className="pg-cut-shell pg-cut-shell--sm absolute left-1/2 top-[calc(100%+0.85rem)] z-50 w-40 -translate-x-1/2 shadow-2xl shadow-black/50">
                <div className="pg-cut-shell__inner overflow-hidden py-1.5">
                  {MORE_LINKS.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMoreOpen(false)}
                      className={({ isActive }) =>
                        [
                          'block px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition',
                          isActive
                            ? 'bg-[var(--pg-accent-dim)] text-[var(--pg-accent)]'
                            : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
                        ].join(' ')
                      }
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </nav>

        <div className="flex items-center justify-self-end gap-2.5 sm:gap-3">
          <ProfileDropdown />
          <NeonButton to="/projects" className="hidden sm:inline-flex">
            View Projects
          </NeonButton>
        </div>
      </div>

      <nav
        className="flex gap-5 overflow-x-auto border-t border-white/[0.04] px-4 py-2.5 md:hidden"
        aria-label="Mobile"
      >
        {[...PRIMARY_LINKS, ...MORE_LINKS].map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `pg-nav-link whitespace-nowrap ${isActive ? 'is-active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

function IconMark({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 1.8l2.1 6.2 6.6.2-5.2 4 1.9 6.3L12 14.9 6.6 18.5l1.9-6.3-5.2-4 6.6-.2L12 1.8z" />
    </svg>
  )
}

function IconChevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" />
    </svg>
  )
}
