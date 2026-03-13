import { useState, ReactNode, useEffect } from 'react'
import { Sidebar, SidebarMode } from './Sidebar'
import { Header } from './Header'

interface DashboardLayoutProps {
  children: ReactNode
}

const SIDEBAR_MODE_KEY = 'pharma-sidebar-mode'

function loadSidebarMode(): SidebarMode {
  const stored = localStorage.getItem(SIDEBAR_MODE_KEY)
  if (stored === 'expanded' || stored === 'collapsed' || stored === 'hover') return stored
  return 'hover'
}

export function DashboardLayout({ children }: DashboardLayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(loadSidebarMode)

  useEffect(() => {
    localStorage.setItem(SIDEBAR_MODE_KEY, sidebarMode)
  }, [sidebarMode])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Top bar — full width, above everything */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Below top bar: sidebar + content */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          mode={sidebarMode}
          onModeChange={setSidebarMode}
        />
        <main className="flex flex-col flex-1 overflow-hidden min-h-0 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
