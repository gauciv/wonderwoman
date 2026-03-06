import { Menu, LogOut, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
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
  '/dashboard/reports': 'Reports',
  '/dashboard/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  // exact match first
  if (routeTitles[pathname]) return routeTitles[pathname]
  // prefix match
  const match = Object.entries(routeTitles).find(([key]) => pathname.startsWith(key) && key !== '/dashboard')
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
  const navigate = useNavigate()
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  async function handleLogout(): Promise<void> {
    await logout()
    navigate('/login')
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 gap-3">
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
        <h1 className="text-base font-semibold text-charcoal-800">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-xs text-muted-foreground truncate max-w-[180px]">
          {currentUser?.email}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-gray-100 transition-colors outline-none">
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
                  {currentUser?.email}
                </p>
                <p className="text-[10px] text-muted-foreground">Administrator</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-xs cursor-pointer">
              <User className="h-3.5 w-3.5" />
              Profile
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
  )
}
