import { useState } from 'react'
import { Menu, LogOut, Sun, Moon, Info, Loader2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'

interface HeaderProps {
  onMenuClick: () => void
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/inventory': 'Inventory',
  '/dashboard/forecast': 'Forecast',
  '/dashboard/vendors': 'Vendors',
  '/dashboard/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname]
  const match = Object.entries(routeTitles).find(
    ([key]) => pathname.startsWith(key) && key !== '/dashboard'
  )
  return match ? match[1] : 'Dashboard'
}

function getInitials(email: string | null | undefined): string {
  if (!email) return 'U'
  const parts = email.split('@')[0].split(/[._-]/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function Header({ onMenuClick }: HeaderProps): JSX.Element {
  const { currentUser, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const title = getPageTitle(location.pathname)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout(): Promise<void> {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white dark:bg-gray-900 dark:border-gray-800 px-4 gap-3 transition-colors duration-200">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="text-base font-semibold text-charcoal-800 dark:text-gray-100">{title}</h1>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground transition-colors"
          >
            {theme === 'dark'
              ? <Sun className="h-4 w-4" />
              : <Moon className="h-4 w-4" />
            }
          </button>

          {/* Avatar / dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors outline-none">
                <Avatar className="h-7 w-7">
                  <AvatarFallback style={{ backgroundColor: '#1060C0' }} className="text-white text-[10px] font-bold">
                    {getInitials(currentUser?.email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {currentUser?.email ?? 'Demo Mode'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Administrator</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
                <Info className="h-3.5 w-3.5" />
                About
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Full-screen logout loading overlay */}
      {loggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white dark:bg-gray-900 px-10 py-8 shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p className="text-sm font-medium text-charcoal-800 dark:text-gray-200">Signing out…</p>
          </div>
        </div>
      )}
    </>
  )
}
