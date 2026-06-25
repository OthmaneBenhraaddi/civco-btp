import { Outlet } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'

export default function AuthLayout() {
  return (
    <div className="auth-layout relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0b0c0e] p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(99,102,241,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(20,184,166,0.06),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:72px_72px]"
        aria-hidden
      />

      <div className="absolute right-5 top-5 z-20 sm:right-8 sm:top-8">
        <LanguageSwitcher variant="header" />
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        <Outlet />
      </div>
    </div>
  )
}
