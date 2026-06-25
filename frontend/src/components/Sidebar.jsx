import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLogout } from '../hooks/useLogout'
import { useTranslation } from '../i18n/LanguageContext'

const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    labelKey: 'nav.dashboard',
    Icon: IconDashboard,
  },
  {
    to: '/tasks',
    labelKey: 'nav.tasks',
    Icon: IconTasks,
  },
  {
    to: '/clients',
    labelKey: 'nav.clients',
    Icon: IconClients,
    adminOnly: true,
  },
  {
    to: '/map',
    labelKey: 'nav.map',
    Icon: IconMap,
  },
  {
    to: '/projects',
    labelKey: 'nav.projects',
    Icon: IconProjects,
  },
  {
    to: '/quotes',
    labelKey: 'nav.quotes',
    Icon: IconQuotes,
    adminOnly: true,
  },
  {
    to: '/delivery-forms',
    labelKey: 'nav.deliveryForms',
    Icon: IconDeliveryForms,
    adminOnly: true,
  },
  {
    to: '/invoices',
    labelKey: 'nav.invoices',
    Icon: IconInvoices,
    adminOnly: true,
  },
  {
    to: '/history',
    labelKey: 'nav.history',
    Icon: IconHistory,
    adminOnly: true,
  },
  {
    to: '/configuration',
    labelKey: 'nav.configuration',
    Icon: IconSettings,
    adminOnly: true,
  },
]

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
    base.push('bg-blue-500/15 font-semibold text-blue-300')
  } else {
    base.push('text-slate-200 hover:bg-white/[0.06] hover:text-white')
  }

  return base.join(' ')
}

export default function Sidebar({ isCollapsed }) {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const logout = useLogout()
  const collapsed = isCollapsed
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside
      className={[
        'sidebar flex h-screen shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-slate-800/80 bg-[#141519] p-4',
        'transition-all duration-300 ease-in-out max-md:hidden',
        collapsed ? 'w-16 px-2' : 'w-64',
      ].join(' ')}
    >
      <div className={['mb-6 shrink-0', collapsed ? 'flex justify-center' : ''].join(' ')}>
        {!collapsed ? (
          <div className="space-y-1">
            <h1 className="flex items-baseline gap-1.5 text-lg font-bold tracking-tight">
              <span className="text-white">{t('layout.brandMain')}</span>
              <span className="text-blue-500">{t('layout.brandAccent')}</span>
            </h1>
            <p className="truncate text-sm text-slate-400">{t('layout.companySubtitle')}</p>
          </div>
        ) : (
          <span className="text-sm font-bold text-blue-500">{t('layout.brandMain').slice(0, 1)}</span>
        )}
      </div>

      {!collapsed && isAdmin ? (
        <div className="mb-4 shrink-0">
          <Link
            to="/projects"
            className="sidebar-new-project flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-500"
          >
            <IconPlus className="h-4 w-4 shrink-0" />
            {t('projects.new')}
          </Link>
        </div>
      ) : null}

      <nav
        className={[
          'sidebar-nav flex flex-1 flex-col gap-y-1',
          collapsed ? 'items-center' : '',
        ].join(' ')}
        aria-label={t('layout.mainNavigation')}
      >
        {visibleNavItems.map(({ to, end, labelKey, Icon }) => {
          const label = t(labelKey)

          return (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => navLinkClasses(isActive, collapsed)}>
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span className="truncate">{label}</span> : null}
              {collapsed ? (
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
          onClick={() => logout()}
          className={[
            'group/nav relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-red-300',
            collapsed ? 'justify-center' : '',
          ].join(' ')}
          title={t('nav.logout')}
        >
          <IconLogOut className="h-5 w-5 shrink-0" />
          {!collapsed ? <span className="truncate">{t('nav.logout')}</span> : null}
        </button>

        <p className="text-center text-[10px] font-medium uppercase tracking-widest text-slate-600">
          {collapsed ? 'v1' : t('layout.versionTag')}
        </p>
      </div>
    </aside>
  )
}
