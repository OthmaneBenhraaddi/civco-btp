import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLogout } from '../../hooks/useLogout'
import { useTranslation } from '../../i18n/LanguageContext'
import { resolveNavPath, getDashboardNavPath } from '../../routes/routeAccess'
import { resolveProfileRoleLabel } from '../../utils/authIdentity'

export default function ProfileDropdown({ variant = 'app' }) {
  const { user, company, tenant, roles, isAdmin, isSuperAdmin, isClientPortalUser } = useAuth()
  const logout = useLogout()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const displayName = user?.full_name || user?.first_name || t('layout.profileFallbackName')
  const roleLabel = resolveProfileRoleLabel(user, roles, t)
  const orgName = tenant?.name || company?.name || t('layout.companySubtitle')
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const avatarUrl = user?.avatar_url || null
  const dashboardPath = getDashboardNavPath(user, roles)

  function AvatarMark({ size = 'md' }) {
    const sizeClass = size === 'lg' ? 'h-9 w-9 text-xs' : 'h-8 w-8 text-[11px]'
    if (avatarUrl) {
      return (
        <span className={`overflow-hidden rounded-full ring-1 ring-white/10 ${sizeClass}`}>
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        </span>
      )
    }

    return (
      <span className={`flex items-center justify-center rounded-full bg-[#1c2433] font-bold text-white ring-1 ring-white/10 ${sizeClass}`}>
        {initials}
      </span>
    )
  }

  const menuItems = variant === 'landing'
    ? [
        { to: dashboardPath, label: t('nav.dashboard'), icon: IconGrid },
        { to: '/profile', label: t('nav.profile'), icon: IconShield },
      ]
    : isSuperAdmin
      ? [
          { to: '/super-admin/overview', label: t('nav.superAdminOverview'), icon: IconGrid },
          { to: '/super-admin/entities', label: t('nav.superAdminEntities'), icon: IconBriefcase },
          { to: '/super-admin/create', label: t('nav.superAdminCreate'), icon: IconBriefcase },
          { to: '/super-admin/demo-codes', label: t('nav.superAdminDemoCodes'), icon: IconClock },
          { to: '/super-admin/demo-requests', label: t('nav.superAdminDemoRequests'), icon: IconClock },
          { to: '/super-admin/homepage', label: t('nav.superAdminHomepage'), icon: IconBriefcase },
          { to: '/super-admin/members', label: t('nav.superAdminMembers'), icon: IconShield },
          { to: '/super-admin/logs', label: t('nav.superAdminLogs'), icon: IconClock },
        ]
      : isClientPortalUser
        ? [
            { to: '/portal', label: t('nav.clientDashboard'), icon: IconGrid },
            { to: '/portal/quotes', label: t('nav.clientQuotes'), icon: IconBriefcase },
          ]
        : [
            { to: '/dashboard', label: t('nav.dashboard'), icon: IconGrid },
            { to: '/projects', label: t('nav.projects'), icon: IconBriefcase },
            { to: '/profile', label: t('nav.profile'), icon: IconShield },
            ...(isAdmin ? [{ to: '/configuration', label: t('nav.configuration'), icon: IconClock }] : []),
          ]

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
          <AvatarMark />
          <span className="hidden min-w-0 text-left sm:block">
            <span className="block truncate text-[12px] font-semibold leading-tight text-white">
              {displayName.split(' ')[0]}
            </span>
            <span className="block truncate text-[10px] font-normal leading-tight tracking-normal text-slate-300">
              {roleLabel}
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
              <AvatarMark size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="truncate text-[11px] text-slate-300">{orgName}</p>
                {user?.email ? (
                  <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                ) : null}
              </div>
            </div>

            <ul className="m-0 list-none p-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <Link
                      to={resolveNavPath(item.to, user)}
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
                  logout()
                }}
                className="pg-cut-btn is-danger is-compact w-full"
              >
                <span className="pg-cut-btn__face !justify-start !px-3">
                  <IconLogout className="h-4 w-4" />
                  {t('nav.logout')}
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
