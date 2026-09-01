import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { useTranslation } from '../i18n/LanguageContext'
import { getDashboardNavPath, navItemVisible, resolveNavPath } from '../routes/routeAccess'

const NAV_ITEMS = [
  {
    to: '/portal',
    end: true,
    labelKey: 'nav.clientDashboard',
    Icon: IconDashboard,
    audience: 'client',
  },
  {
    to: '/portal/tickets',
    labelKey: 'nav.tickets',
    Icon: IconDiscussions,
    audience: 'client',
  },
  {
    to: '/portal/calendar',
    labelKey: 'nav.clientCalendar',
    Icon: IconCalendar,
    audience: 'client',
  },
  {
    to: '/portal/quotes',
    labelKey: 'nav.clientQuotes',
    Icon: IconQuotes,
    audience: 'client',
  },
  {
    to: '/dashboard',
    end: true,
    labelKey: 'nav.dashboard',
    Icon: IconDashboard,
    audience: 'erp',
    permission: 'dashboard.view',
  },
  {
    to: '/tasks',
    labelKey: 'nav.tasks',
    Icon: IconTasks,
    audience: 'erp',
    anyPermissions: ['project.view', 'task.view_all', 'task.view_own', 'manage_tasks'],
  },
  {
    to: '/clients',
    labelKey: 'nav.clients',
    Icon: IconClients,
    audience: 'erp',
    permission: 'client.view',
  },
  {
    to: '/tickets',
    labelKey: 'nav.tickets',
    Icon: IconDiscussions,
    audience: 'erp',
    permission: 'ticket.view',
  },
  {
    to: '/map',
    labelKey: 'nav.map',
    Icon: IconMap,
    audience: 'erp',
    permission: 'project.view',
  },
  {
    to: '/projects',
    labelKey: 'nav.projects',
    Icon: IconProjects,
    audience: 'erp',
    permission: 'project.view',
  },
  {
    to: '/quotes',
    labelKey: 'nav.quotes',
    Icon: IconQuotes,
    audience: 'erp',
    permission: 'quote.view',
  },
  {
    to: '/delivery-forms',
    labelKey: 'nav.deliveryForms',
    Icon: IconDeliveryForms,
    audience: 'erp',
    permission: 'delivery_form.view',
  },
  {
    to: '/invoices',
    labelKey: 'nav.invoices',
    Icon: IconInvoices,
    audience: 'erp',
    permission: 'invoice.view',
  },
  {
    to: '/history',
    labelKey: 'nav.history',
    Icon: IconHistory,
    audience: 'erp',
    adminOnly: true,
  },
  {
    to: '/team',
    labelKey: 'nav.team',
    Icon: IconTeam,
    audience: 'erp',
    adminOnly: true,
    tenantAdminOnly: true,
  },
  {
    to: '/profile',
    labelKey: 'nav.profile',
    Icon: IconSettings,
    audience: 'erp',
  },
  {
    to: '/configuration',
    labelKey: 'nav.configuration',
    Icon: IconSettings,
    audience: 'erp',
    adminOnly: true,
  },
]

const SUPER_ADMIN_NAV_ITEMS = [
  {
    to: '/super-admin',
    end: true,
    labelKey: 'nav.superAdminOverview',
    Icon: IconDashboard,
  },
  {
    to: '/super-admin/entities',
    labelKey: 'nav.superAdminEntities',
    Icon: IconSuperAdmin,
  },
  {
    to: '/super-admin/create',
    labelKey: 'nav.superAdminCreate',
    Icon: IconPlus,
  },
  {
    to: '/super-admin/homepage',
    labelKey: 'nav.superAdminHomepage',
    Icon: IconSettings,
  },
  {
    to: '/super-admin/demo-requests',
    labelKey: 'nav.superAdminDemoRequests',
    Icon: IconHistory,
  },
  {
    to: '/super-admin/members',
    labelKey: 'nav.superAdminMembers',
    Icon: IconTeam,
  },
  {
    to: '/super-admin/logs',
    labelKey: 'nav.superAdminLogs',
    Icon: IconHistory,
  },
]

function IconSuperAdmin({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 20h16M6 20V8l6-4 6 4v12" strokeLinejoin="round" />
      <path d="M10 12h4M12 10v4" strokeLinecap="round" />
    </svg>
  )
}

function IconTeam({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M16 11a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z" />
      <path d="M4 20a6 6 0 0 1 12 0" strokeLinecap="round" />
      <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
    </svg>
  )
}

function IconDiscussions({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H8l-4 3V6a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M8 10h8M8 13h5" strokeLinecap="round" />
    </svg>
  )
}

function IconCalendar({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
    </svg>
  )
}

function IconPortal({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 20V10l8-6 8 6v10" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" strokeLinejoin="round" />
    </svg>
  )
}

function IconDashboard({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconTasks({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 11l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  )
}

function IconClients({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c0-2.5 2.5-4 6-4s6 1.5 6 4" strokeLinecap="round" />
      <path d="M16 11h5M18.5 8.5v5" strokeLinecap="round" />
    </svg>
  )
}

function IconMap({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" strokeLinecap="round" />
    </svg>
  )
}

function IconProjects({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M4 7h16v12H4z" strokeLinejoin="round" />
      <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" strokeLinecap="round" />
    </svg>
  )
}

function IconQuotes({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 4h8a2 2 0 012 2v12l-3-2-3 2-3-2-3 2V6a2 2 0 012-2z" strokeLinejoin="round" />
    </svg>
  )
}

function IconDeliveryForms({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 4h10a2 2 0 012 2v14H5V6a2 2 0 012-2z" strokeLinejoin="round" />
      <path d="M9 9h6M9 13h4" strokeLinecap="round" />
      <path d="M12 4v4" strokeLinecap="round" />
    </svg>
  )
}

function IconInvoices({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M7 3h10a2 2 0 012 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  )
}

function IconSettings({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconLogOut({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconHistory({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3v2M16 3v2" strokeLinecap="round" />
    </svg>
  )
}

function IconPlus({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function navLinkClasses(isActive, collapsed) {
  const base = [
    'group/nav relative flex items-center text-sm font-medium transition-all duration-200 ease-in-out',
  ]

  if (collapsed) {
    base.push('mx-auto h-10 w-10 justify-center rounded-xl')
  } else {
    base.push('gap-3 rounded-xl px-4 py-2.5')
  }

  if (isActive) {
    base.push('bg-white/[0.06] font-medium text-white')
  } else {
    base.push('text-slate-400 hover:bg-white/[0.03] hover:text-slate-200')
  }

  return base.join(' ')
}

function isNavItemVisible(item, { isClientPortalUser, isAdmin, user, hasPermission }) {
  return navItemVisible(item, { isClientPortalUser, isAdmin, user, hasPermission })
}

function SidebarBrand({ collapsed, tenant, appName, subtitleFallback }) {
  const logoUrl = tenant?.logo_url ?? null
  const [logoBroken, setLogoBroken] = useState(false)
  const showLogo = Boolean(logoUrl) && !logoBroken
  const brandLabel = tenant?.name || appName

  useEffect(() => {
    setLogoBroken(false)
  }, [logoUrl])

  if (collapsed) {
    if (showLogo) {
      return (
        <img
          src={logoUrl}
          alt={brandLabel}
          className="h-8 w-8 rounded-md bg-white/5 object-contain p-0.5"
          onError={() => setLogoBroken(true)}
        />
      )
    }

    return (
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06] text-sm font-semibold text-white"
        title={appName}
      >
        {appName.slice(0, 1)}
      </span>
    )
  }

  return (
    <div className="min-w-0 space-y-1.5">
      {showLogo ? (
        <img
          src={logoUrl}
          alt={brandLabel}
          className="h-10 max-w-[180px] object-contain object-left"
          onError={() => setLogoBroken(true)}
        />
      ) : (
        <h1 className="truncate text-lg font-semibold tracking-tight text-white">
          {appName}
        </h1>
      )}
      <p className="truncate text-sm text-slate-400">
        {tenant?.name ?? subtitleFallback}
      </p>
    </div>
  )
}

export default function Sidebar({ isCollapsed, mobileOpen = false, onMobileClose }) {
  const { t } = useTranslation()
  const { isAdmin, isSuperAdmin, isClientPortalUser, user, tenant, roles, hasPermission } = useAuth()
  const logout = useLogout()
  const visibleNavItems = isSuperAdmin
    ? SUPER_ADMIN_NAV_ITEMS
    : NAV_ITEMS.filter((item) => isNavItemVisible(item, {
      isClientPortalUser,
      isAdmin,
      user,
      hasPermission,
    }))
  const navCollapsed = isCollapsed && !mobileOpen

  function resolveItemPath(item) {
    if (item.labelKey === 'nav.dashboard') {
      return getDashboardNavPath(user, roles)
    }

    return resolveNavPath(item.to, user)
  }

  function handleNavClick() {
    if (mobileOpen) {
      onMobileClose?.()
    }
  }

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onMobileClose}
          aria-label={t('layout.closeMenu')}
        />
      ) : null}

      <aside
        className={[
          'sidebar fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-white/[0.06] bg-[#121316] p-4',
          'transition-transform duration-300 ease-in-out md:relative md:z-auto md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          navCollapsed ? 'md:w-16 md:px-2' : 'md:w-64',
        ].join(' ')}
      >
        <div className={['mb-6 shrink-0', navCollapsed ? 'flex justify-center' : ''].join(' ')}>
          <SidebarBrand
            collapsed={navCollapsed}
            tenant={tenant}
            appName={t('layout.appName')}
            subtitleFallback={t('layout.companySubtitle')}
          />
        </div>

        {!navCollapsed && isAdmin && !isSuperAdmin ? (
          <div className="mb-4 shrink-0">
            <Link
              to={resolveNavPath('/projects', user)}
              onClick={handleNavClick}
              className="sidebar-new-project flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200"
            >
              <IconPlus className="h-4 w-4 shrink-0" />
              {t('projects.new')}
            </Link>
          </div>
        ) : null}

        <nav
          className={[
            'sidebar-nav flex flex-1 flex-col gap-y-1',
            navCollapsed ? 'items-center' : '',
          ].join(' ')}
          aria-label={t('layout.mainNavigation')}
        >
          {visibleNavItems.map((item) => {
            const { end, labelKey, Icon } = item
            const to = resolveItemPath(item)
            const label = t(labelKey)

            return (
              <NavLink
                key={`${labelKey}-${to}`}
                to={to}
                end={end}
                onClick={handleNavClick}
                className={({ isActive }) => navLinkClasses(isActive, navCollapsed)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!navCollapsed ? <span className="truncate">{label}</span> : null}
                {navCollapsed ? (
                  <span
                    className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-slate-800/80 bg-[#111214] px-2.5 py-1.5 text-xs font-medium text-slate-200 opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-hover/nav:opacity-100"
                    role="tooltip"
                  >
                    {label}
                  </span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-auto shrink-0 space-y-3 pt-4">
          <button
            type="button"
            onClick={() => {
              handleNavClick()
              logout()
            }}
            className={[
              'sidebar-logout-btn group/nav relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
              'text-sm font-medium text-slate-300 transition-colors',
              'hover:bg-white/[0.06] hover:text-red-300',
              navCollapsed ? 'justify-center' : '',
            ].join(' ')}
            title={t('nav.logout')}
          >
            <IconLogOut className="h-5 w-5 shrink-0" />
            {!navCollapsed ? <span className="truncate">{t('nav.logout')}</span> : null}
          </button>

          <p className="text-center text-[10px] font-medium uppercase tracking-widest text-slate-600">
            {navCollapsed ? 'v1' : t('layout.versionTag')}
          </p>
        </div>
      </aside>
    </>
  )
}
