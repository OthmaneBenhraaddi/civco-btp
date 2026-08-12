import { Outlet } from 'react-router-dom'
import ProdigyNavbar from '../components/prodigy/ProdigyNavbar'

export default function AppLayout() {
  return (
    <div className="pg-shell flex h-full w-full flex-col overflow-hidden">
      <ProdigyNavbar />
      <main className="pg-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </main>
    </div>
  )
}
