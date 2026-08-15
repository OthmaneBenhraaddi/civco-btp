import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from '../i18n/LanguageContext'
import { appendTenantQuery } from '../utils/tenantDevContext'

export default function AuthLayout() {
  const { t } = useTranslation()

  return (
    <div className="pg-shell auth-layout relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0b0f17] p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(34,197,94,0.16),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(34,197,94,0.06),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:72px_72px]"
        aria-hidden
      />

      <Link
        to={appendTenantQuery('/')}
        className="pg-back-link absolute left-4 top-4 z-20 sm:left-6 sm:top-6"
      >
        <IconChevronLeft className="h-3.5 w-3.5" />
        {t('auth.backToHome')}
      </Link>

      <div className="relative z-10 w-full max-w-[440px]">
        <Outlet />
      </div>
    </div>
  )
}

function IconChevronLeft({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M12.7 4.3a1 1 0 010 1.4L8.4 10l4.3 4.3a1 1 0 11-1.4 1.4l-5-5a1 1 0 010-1.4l5-5a1 1 0 011.4 0z" />
    </svg>
  )
}
