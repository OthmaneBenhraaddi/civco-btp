import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Sidebar from '../components/Sidebar'

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  function toggleSidebar() {
    setIsCollapsed((value) => !value)
  }

  return (
    <div className="app-shell flex h-full w-full overflow-hidden bg-[#111827]">
      <Sidebar isCollapsed={isCollapsed} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader isCollapsed={isCollapsed} onToggleCollapse={toggleSidebar} />

        <main className="main-content main-content-scroll min-h-0 flex-1 overflow-y-auto bg-[#111827] text-slate-200">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
