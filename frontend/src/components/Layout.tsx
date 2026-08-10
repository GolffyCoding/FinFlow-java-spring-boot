import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Landmark,
  ArrowLeftRight,
  ShieldAlert,
  ScrollText,
  LogOut,
  Menu,
  Bell,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '../services/api'
import { FraudAlert } from '../types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

const menuItems = [
  { text: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { text: 'Accounts', icon: Landmark, path: '/accounts' },
  { text: 'Transactions', icon: ArrowLeftRight, path: '/transactions' },
  { text: 'Fraud Alerts', icon: ShieldAlert, path: '/fraud-alerts' },
  { text: 'Audit Logs', icon: ScrollText, path: '/audit-logs' }
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          F
        </div>
        <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
          FinFlow
        </span>
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const active = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.text}
              onClick={() => {
                navigate(item.path)
                onNavigate?.()
              }}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.text}
            </button>
          )
        })}
      </nav>
      <Separator className="bg-sidebar-border" />
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  )
}

function NotificationBell() {
  const navigate = useNavigate()
  const { data } = useQuery({
    queryKey: ['layout-open-alerts'],
    queryFn: async () => {
      const res = await api.get('/fraud/alerts?status=OPEN&page=0&size=5')
      return res.data as { content: FraudAlert[]; totalElements: number }
    },
    refetchInterval: 30000
  })

  const alerts = data?.content ?? []
  const count = data?.totalElements ?? 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex size-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Open Fraud Alerts ({count})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {alerts.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No open alerts</p>
        ) : (
          alerts.map((alert) => (
            <DropdownMenuItem
              key={alert.id}
              className="flex items-center justify-between gap-2"
              onClick={() => navigate('/fraud-alerts')}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{alert.transactionId}</p>
                <p className="truncate text-xs text-muted-foreground">{alert.reason}</p>
              </div>
              <Badge variant={alert.fraudLevel === 'CRITICAL' ? 'destructive' : 'warning'}>
                {alert.fraudLevel}
              </Badge>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/fraud-alerts')} className="justify-center text-sm">
          View all alerts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const exactMatch = menuItems.find((m) => m.path === location.pathname)?.text
  const currentTitle =
    exactMatch ??
    (location.pathname.startsWith('/transactions/')
      ? 'Transaction Detail'
      : location.pathname.startsWith('/fraud-alerts/')
        ? 'Fraud Investigation'
        : location.pathname.startsWith('/transfer')
          ? 'Transfer'
          : 'FinFlow')

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar sm:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60 bg-sidebar">
            <div className="flex justify-end p-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-4 text-sidebar-foreground" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <h1 className="flex-1 truncate text-sm font-medium text-foreground sm:text-base">
            {currentTitle}
          </h1>
          <NotificationBell />
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              A
            </AvatarFallback>
          </Avatar>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
