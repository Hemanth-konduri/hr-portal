'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Bell, User, KeyRound, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const pageTitles: Record<string, string> = {
  '/super-admin/dashboard':     'Overview',
  '/super-admin/admins':        'Admin Management',
  '/admin/dashboard':           'Overview',
  '/admin/employees':           'Employee Management',
  '/admin/attendance':          'Attendance Management',
  '/admin/leaves':              'Leave Approvals',
  '/admin/payroll':             'Payroll Management',
  '/admin/performance':         'Performance Management',
  '/admin/documents':           'Document Management',
  '/admin/announcements':       'Announcements',
  '/employee/dashboard':        'My Dashboard',
  '/employee/attendance':       'My Attendance',
  '/employee/leaves':           'My Leaves',
  '/employee/payslips':         'My Payslips',
  '/employee/announcements':    'Announcements',
  '/employee/performance':      'Performance',
  '/employee/documents':        'Documents',
  '/profile':                   'My Profile',
}

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  employee:    'Employee',
}

const roleBadgeClass: Record<string, string> = {
  super_admin: 'bg-amber-100 text-amber-800 border-amber-200',
  admin:       'bg-blue-100 text-blue-800 border-blue-200',
  employee:    'bg-violet-100 text-violet-800 border-violet-200',
}

export default function AppHeader() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()

  const title = pageTitles[pathname] || 'Dashboard'

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const showNotifications = user?.role === 'admin' || user?.role === 'employee'

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 lg:px-8">
      {/* Left — page title */}
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight">{title}</h1>
        <p className="text-xs text-muted-foreground">{today}</p>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">

        {/* Notification bell — admin & employee only */}
        {showNotifications && (
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell size={16} />
            {/* unread dot — wire to real count later */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-card" />
          </Button>
        )}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors outline-none">
              <Avatar className="h-8 w-8 border border-border shrink-0">
                <AvatarFallback className="text-xs font-bold bg-amber-100 text-amber-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-foreground leading-none">{user?.full_name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {roleLabel[user?.role ?? ''] ?? user?.role}
                </p>
              </div>
              <ChevronDown size={13} className="hidden sm:block text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User info header */}
            <DropdownMenuLabel className="pb-2">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-9 w-9 border border-border shrink-0">
                  <AvatarFallback className="text-xs font-bold bg-amber-100 text-amber-800">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  <Badge variant="outline" className={`mt-1 text-[9px] px-1.5 py-0 ${roleBadgeClass[user?.role ?? '']}`}>
                    {roleLabel[user?.role ?? ''] ?? user?.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push('/profile')} className="cursor-pointer gap-2">
              <User size={14} />
              My Profile
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push('/profile?tab=security')} className="cursor-pointer gap-2">
              <KeyRound size={14} />
              Change Password
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="cursor-pointer gap-2"
            >
              <LogOut size={14} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
