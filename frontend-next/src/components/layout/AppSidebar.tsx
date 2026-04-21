'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign,
  Megaphone, FileText, Award, ShieldCheck, LogOut, Building2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const superAdminLinks = [
  { href: '/super-admin/dashboard', label: 'Overview',      icon: LayoutDashboard },
  { href: '/super-admin/admins',    label: 'Admins',        icon: ShieldCheck     },
  { href: '/admin/employees',       label: 'Employees',     icon: Users           },
  { href: '/admin/attendance',      label: 'Attendance',    icon: Clock           },
  { href: '/admin/leaves',          label: 'Leaves',        icon: CalendarDays    },
  { href: '/admin/payroll',         label: 'Payroll',       icon: DollarSign      },
  { href: '/admin/performance',     label: 'Performance',   icon: Award           },
  { href: '/admin/documents',       label: 'Documents',     icon: FileText        },
  { href: '/admin/announcements',   label: 'Announcements', icon: Megaphone       },
]

const adminLinks = [
  { href: '/admin/dashboard',       label: 'Overview',      icon: LayoutDashboard },
  { href: '/admin/employees',       label: 'Employees',     icon: Users           },
  { href: '/admin/attendance',      label: 'Attendance',    icon: Clock           },
  { href: '/admin/leaves',          label: 'Leaves',        icon: CalendarDays    },
  { href: '/admin/payroll',         label: 'Payroll',       icon: DollarSign      },
  { href: '/admin/performance',     label: 'Performance',   icon: Award           },
  { href: '/admin/documents',       label: 'Documents',     icon: FileText        },
  { href: '/admin/announcements',   label: 'Announcements', icon: Megaphone       },
]

const employeeLinks = [
  { href: '/employee/dashboard',      label: 'Overview',       icon: LayoutDashboard },
  { href: '/employee/attendance',     label: 'Attendance',     icon: Clock           },
  { href: '/employee/leaves',         label: 'My Leaves',      icon: CalendarDays    },
  { href: '/employee/payslips',       label: 'Payslips',       icon: DollarSign      },
  { href: '/employee/announcements',  label: 'Announcements',  icon: Megaphone       },
  { href: '/employee/performance',    label: 'Performance',    icon: Award           },
  { href: '/employee/documents',      label: 'Documents',      icon: FileText        },
]

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  employee: 'Employee',
}

const roleBadgeColor: Record<string, string> = {
  super_admin: 'bg-amber-100 text-amber-800 border-amber-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  employee: 'bg-violet-100 text-violet-800 border-violet-200',
}

interface AppSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export default function AppSidebar({ mobileOpen = false, onClose }: AppSidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const links =
    user?.role === 'super_admin' ? superAdminLinks :
    user?.role === 'admin' ? adminLinks : employeeLinks

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden',
          mobileOpen
            ? 'visible opacity-100 pointer-events-auto'
            : 'invisible opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#0f0f13] text-white shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:flex',
          mobileOpen
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full pointer-events-none md:pointer-events-auto'
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Logo */}
        <div className="flex items-center justify-between gap-3 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 shadow-lg">
              <Building2 size={18} className="text-[#0f0f13]" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-white">HR Portal</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Management</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="inline-flex md:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={16} />
          </Button>
        </div>

        <Separator className="bg-white/5" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
            Navigation
          </p>
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-amber-400 text-[#0f0f13] shadow-sm'
                    : 'text-white/50 hover:bg-white/5 hover:text-white'
                )}
                onClick={onClose}
              >
                <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>

        <Separator className="bg-white/5" />

        {/* User + Logout */}
        <div className="px-3 py-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-3">
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarFallback className="bg-amber-400 text-[#0f0f13] text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 text-xs"
          >
            <LogOut size={14} />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  )
}
