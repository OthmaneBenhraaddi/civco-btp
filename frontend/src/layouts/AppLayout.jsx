import { Outlet } from 'react-router-dom'
import DemoExpiryBanner from '../components/DemoExpiryBanner'
import ProdigyNavbar from '../components/prodigy/ProdigyNavbar'
import { useAuth } from '../context/AuthContext'
import { PORTAL_COC_CLASS } from '../features/client-portal/portalTheme'
import '../features/client-portal/portalCoc.css'

export default function AppLayout() {
  const { isClientPortalUser } = useAuth()

  return (
    <div
      className={[
        'pg-shell flex h-full w-full flex-col overflow-hidden',
        isClientPortalUser ? PORTAL_COC_CLASS : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ProdigyNavbar />
      <DemoExpiryBanner />
      <main className="main-content main-content-scroll pg-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain text-slate-300">
        <Outlet />
      </main>
    </div>
  )
}
