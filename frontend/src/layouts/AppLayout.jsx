import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import Sidebar from '../components/Sidebar'

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  function toggleSidebar() {
    setIsCollapsed((value) => !value)
  }

  function toggleMobileNav() {
    setIsMobileNavOpen((value) => !value)
  }

  function closeMobileNav() {
    setIsMobileNavOpen(false)
  }

  useEffect(() => {
    if (!isMobileNavOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileNavOpen])

  return (
    <div className="app-shell flex h-full w-full overflow-hidden bg-[#0b0c0e]">
      <Sidebar
        isCollapsed={isCollapsed}
        mobileOpen={isMobileNavOpen}
        onMobileClose={closeMobileNav}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppHeader
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleSidebar}
          isMobileNavOpen={isMobileNavOpen}
          onToggleMobileNav={toggleMobileNav}
        />

        <main className="main-content main-content-scroll min-h-0 flex-1 overflow-y-auto bg-[#0b0c0e] text-slate-300">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
