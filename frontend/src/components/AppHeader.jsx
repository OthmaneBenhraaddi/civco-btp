import { useAuth } from '../context/AuthContext'
import { useTranslation } from '../i18n/LanguageContext'
import GlobalSearch from './GlobalSearch'
import LanguageSwitcher from './LanguageSwitcher'
import NotificationDropdown from './NotificationDropdown'

function IconMenu({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

function buildAvatarUrl(name) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'Admin')}&backgroundColor=334155`
}

export default function AppHeader({ isCollapsed, onToggleCollapse }) {
  const { user } = useAuth()
  const { t } = useTranslation()

  const displayName = user?.full_name ?? t('layout.profileFallbackName')

  return (
    <header className="app-header sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between overflow-visible border-b border-slate-800/80 bg-[#141519] px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4 pr-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')}
          className="app-header-icon-btn hidden shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-white md:inline-flex"
        >
          <IconMenu className="h-5 w-5" />
        </button>

        <GlobalSearch />
      </div>

      <div className="flex h-full shrink-0 items-center gap-3 sm:gap-5">
        <LanguageSwitcher variant="header" />

        <NotificationDropdown />

        <div className="flex items-center gap-3 border-l border-slate-800/80 pl-4">
          <img
            src={buildAvatarUrl(displayName)}
            alt=""
            className="h-9 w-9 rounded-full ring-1 ring-slate-700/80"
          />
          <div className="hidden min-w-0 sm:block">
            <p className="text-xs text-slate-500">{t('layout.profileRole')}</p>
            <p className="truncate text-sm font-semibold text-slate-200">{displayName}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
