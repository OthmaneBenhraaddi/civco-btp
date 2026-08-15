import { useEffect, useRef, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import NeonButton from './NeonButton'
import ProfileDropdown from './ProfileDropdown'
import GlobalSearch from '../GlobalSearch'
import NotificationDropdown from '../NotificationDropdown'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from '../../i18n/LanguageContext'
import { getDashboardNavPath, navItemVisible, resolveNavPath } from '../../routes/routeAccess'

const APP_NAV_ITEMS = [
  { to: '/portal', end: true, labelKey: 'nav.clientDashboard', audience: 'client' },
  { to: '/portal/tickets', labelKey: 'nav.tickets', audience: 'client' },
  { to: '/portal/calendar', labelKey: 'nav.clientCalendar', audience: 'client' },
  { to: '/portal/quotes', labelKey: 'nav.clientQuotes', audience: 'client' },
  { to: '/', end: true, labelKey: 'nav.dashboard', audience: 'erp', permission: 'dashboard.view' },
  { to: '/projects', labelKey: 'nav.projects', audience: 'erp', permission: 'project.view' },
  { to: '/clients', labelKey: 'nav.clients', audience: 'erp', permission: 'client.view' },
  {
    to: '/tasks',
    labelKey: 'nav.tasks',
    audience: 'erp',
    anyPermissions: ['project.view', 'task.view_all', 'task.view_own', 'manage_tasks'],
  },
  { to: '/quotes', labelKey: 'nav.quotes', audience: 'erp', permission: 'quote.view' },
  { to: '/tickets', labelKey: 'nav.tickets', audience: 'erp', permission: 'ticket.view' },
  { to: '/map', labelKey: 'nav.map', audience: 'erp', permission: 'project.view' },
  { to: '/delivery-forms', labelKey: 'nav.deliveryForms', audience: 'erp', permission: 'delivery_form.view' },
  { to: '/invoices', labelKey: 'nav.invoices', audience: 'erp', permission: 'invoice.view' },
  { to: '/history', labelKey: 'nav.history', audience: 'erp', adminOnly: true },
  { to: '/team', labelKey: 'nav.team', audience: 'erp', adminOnly: true, tenantAdminOnly: true },
  { to: '/profile', labelKey: 'nav.profile', audience: 'erp' },
  { to: '/configuration', labelKey: 'nav.configuration', audience: 'erp', adminOnly: true },
]

const SUPER_ADMIN_NAV_ITEMS = [
  { to: '/super-admin/overview', end: true, labelKey: 'nav.superAdminOverview' },
  { to: '/super-admin/entities', labelKey: 'nav.superAdminEntities' },
  { to: '/super-admin/create', labelKey: 'nav.superAdminCreate' },
  { to: '/super-admin/demo-codes', labelKey: 'nav.superAdminDemoCodes' },
  { to: '/super-admin/members', labelKey: 'nav.superAdminMembers' },
  { to: '/super-admin/logs', labelKey: 'nav.superAdminLogs' },
]

const ERP_PRIMARY_KEYS = ['nav.dashboard', 'nav.projects', 'nav.clients', 'nav.tasks', 'nav.quotes', 'nav.tickets']
const SUPER_ADMIN_PRIMARY_KEYS = [
  'nav.superAdminOverview',
  'nav.superAdminEntities',
  'nav.superAdminCreate',
]

export default function ProdigyNavbar() {
  const { t } = useTranslation()
  const { isAdmin, isSuperAdmin, isClientPortalUser, user, tenant, roles, hasPermission } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef(null)

  const visibleItems = isSuperAdmin
    ? SUPER_ADMIN_NAV_ITEMS
    : APP_NAV_ITEMS.filter((item) => navItemVisible(item, {
      isClientPortalUser,
      isAdmin,
      user,
      hasPermission,
    }))

  const primaryKeys = isSuperAdmin
    ? SUPER_ADMIN_PRIMARY_KEYS
    : isClientPortalUser
      ? visibleItems.map((item) => item.labelKey)
      : ERP_PRIMARY_KEYS

  const primaryItems = visibleItems.filter((item) => primaryKeys.includes(item.labelKey))
  const moreItems = visibleItems.filter((item) => !primaryKeys.includes(item.labelKey))

  useEffect(() => {
    function onPointerDown(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  function resolveItemPath(item) {
    if (item.labelKey === 'nav.dashboard') {
      return getDashboardNavPath(user, roles)
    }

    return resolveNavPath(item.to, user)
  }

  const homePath = isSuperAdmin
    ? '/super-admin/overview'
    : isClientPortalUser
      ? resolveNavPath('/portal', user)
      : getDashboardNavPath(user, roles)

  const cta = isSuperAdmin
    ? { to: '/super-admin/create', label: t('nav.superAdminCreate') }
    : isAdmin && !isClientPortalUser
      ? { to: resolveNavPath('/projects', user), label: t('layout.viewProjects') }
      : null

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-[#0b0f17]/90 backdrop-blur-xl">
      <div className="mx-auto grid h-[4.5rem] max-w-[1180px] grid-cols-[1fr_auto] items-center gap-3 px-4 sm:px-6 lg:grid-cols-[auto_1fr_auto]">
        <BrandLink to={homePath} tenant={tenant} appName={t('layout.appName')} />

        <nav className="hidden items-center justify-center gap-5 lg:flex" aria-label={t('layout.mainNavigation')}>
          {primaryItems.map((item) => (
            <NavLink
              key={`${item.labelKey}-${item.to}`}
              to={resolveItemPath(item)}
              end={item.end}
              className={({ isActive }) => `pg-nav-link whitespace-nowrap ${isActive ? 'is-active' : ''}`}
            >
              {t(item.labelKey)}
            </NavLink>
          ))}

          {moreItems.length > 0 ? (
            <div ref={moreRef} className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((value) => !value)}
                className={`pg-nav-link whitespace-nowrap ${moreOpen ? 'is-active text-white' : ''}`}
                aria-expanded={moreOpen}
              >
                {t('nav.more')}
                <IconChevron className={`h-3 w-3 transition ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen ? (
                <div className="pg-cut-shell pg-cut-shell--sm absolute left-1/2 top-[calc(100%+0.85rem)] z-50 w-52 -translate-x-1/2 shadow-2xl shadow-black/50">
                  <div className="pg-cut-shell__inner overflow-hidden py-1.5">
                    {moreItems.map((item) => (
                      <NavLink
                        key={`${item.labelKey}-${item.to}`}
                        to={resolveItemPath(item)}
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
                        {t(item.labelKey)}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className="flex items-center justify-self-end gap-1.5 sm:gap-2.5">
          <GlobalSearch />
          <NotificationDropdown />
          <ProfileDropdown />
          {cta ? (
            <NeonButton to={cta.to} className="hidden xl:inline-flex">
              {cta.label}
            </NeonButton>
          ) : null}
        </div>
      </div>

      <nav
        className="flex gap-5 overflow-x-auto border-t border-white/[0.04] px-4 py-2.5 lg:hidden"
        aria-label={t('layout.mainNavigation')}
      >
        {visibleItems.map((item) => (
          <NavLink
            key={`mobile-${item.labelKey}-${item.to}`}
            to={resolveItemPath(item)}
            end={item.end}
            className={({ isActive }) => `pg-nav-link whitespace-nowrap ${isActive ? 'is-active' : ''}`}
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

function BrandLink({ to, tenant, appName }) {
  const logoUrl = tenant?.logo_url ?? tenant?.logoUrl ?? tenant?.logo ?? null
  const [logoBroken, setLogoBroken] = useState(false)
  const showLogo = Boolean(logoUrl) && !logoBroken
  const brandLabel = tenant?.name || appName

  useEffect(() => {
    setLogoBroken(false)
  }, [logoUrl])

  return (
    <Link to={to} className="group flex shrink-0 items-center gap-2.5 justify-self-start">
      {showLogo ? (
        <img
          src={logoUrl}
          alt={brandLabel}
          className="h-6 w-6 object-contain"
          onError={() => setLogoBroken(true)}
        />
      ) : (
        <IconMark className="h-7 w-7 text-[var(--pg-accent)] transition group-hover:drop-shadow-[0_0_10px_var(--pg-accent-glow)]" />
      )}
      <span className="leading-none">
        <span className="pg-brand block text-[15px] sm:text-base">{appName}</span>
        {tenant?.name ? (
          <span className="mt-0.5 block max-w-[9rem] truncate text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
            {tenant.name}
          </span>
        ) : (
          <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.28em] text-white/90">
            BTP
          </span>
        )}
      </span>
    </Link>
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
