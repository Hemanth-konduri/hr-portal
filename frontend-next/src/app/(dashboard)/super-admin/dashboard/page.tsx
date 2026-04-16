'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api/axios'
import { User, LeaveRequest, AttendanceRecord, Announcement, Payslip } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'

// Reusable dashboard components
import { StatCard }              from '@/components/dashboard/StatCard'
import { WelcomeBanner }         from '@/components/dashboard/WelcomeBanner'
import { AttendanceTrendChart }  from '@/components/dashboard/AttendanceTrendChart'
import { LeavePieChart }         from '@/components/dashboard/LeavePieChart'
import { DepartmentBarChart }    from '@/components/dashboard/DepartmentBarChart'
import { PayrollLineChart }      from '@/components/dashboard/PayrollLineChart'
import { LeaveTypeChart }        from '@/components/dashboard/LeaveTypeChart'
import { RecentLeavesTable }     from '@/components/dashboard/RecentLeavesTable'
import { RecentEmployeesTable }  from '@/components/dashboard/RecentEmployeesTable'
import { AnnouncementsFeed }     from '@/components/dashboard/AnnouncementsFeed'
import { QuickActions }          from '@/components/dashboard/QuickActions'
import { attendanceDateKey }     from '@/lib/attendance-dates'

import {
  Users, ShieldCheck, CalendarDays, UserCheck,
  Clock, DollarSign, Megaphone, TrendingUp,
  UserX, AlertCircle,
} from 'lucide-react'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const { user } = useAuth()

  const [users,          setUsers]          = useState<User[]>([])
  const [leaves,         setLeaves]         = useState<LeaveRequest[]>([])
  const [attendance,     setAttendance]     = useState<AttendanceRecord[]>([])
  const [announcements,  setAnnouncements]  = useState<Announcement[]>([])
  const [payslips,       setPayslips]       = useState<Payslip[]>([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/leaves/all').catch(() => ({ data: [] })),
      api.get('/attendance/all').catch(() => ({ data: [] })),
      api.get('/announcements').catch(() => ({ data: [] })),
      api.get('/payslips/all').catch(() => ({ data: [] })),
    ]).then(([u, l, a, ann, p]) => {
      setUsers(u.data)
      setLeaves(l.data)
      setAttendance(a.data)
      setAnnouncements(ann.data)
      setPayslips(p.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const employees  = users.filter(u => u.role === 'employee')
  const admins     = users.filter(u => u.role === 'admin')
  const active     = employees.filter(e => e.status === 'active').length
  const inactive   = employees.filter(e => e.status !== 'active').length
  const pending    = leaves.filter(l => l.status === 'pending').length
  const approved   = leaves.filter(l => l.status === 'approved').length
  const rejected   = leaves.filter(l => l.status === 'rejected').length

  const todayStr   = attendanceDateKey(new Date().toISOString())
  const todayRecs  = attendance.filter(r => attendanceDateKey(r.date) === todayStr)
  const presentToday = todayRecs.filter(r => r.status === 'present' || r.status === 'half_day').length
  const lateToday    = todayRecs.filter(r => r.is_late).length

  const totalPayroll = payslips.reduce((s, p) => s + Number(p.net_salary || 0), 0)

  const quickActionsList = [
    { label: 'Add Employee',    href: '/admin/employees',     icon: Users,        iconClass: 'bg-blue-50 text-blue-600'    },
    { label: 'Manage Admins',   href: '/super-admin/admins',  icon: ShieldCheck,  iconClass: 'bg-amber-50 text-amber-600'  },
    { label: 'Leave Approvals', href: '/admin/leaves',        icon: CalendarDays, iconClass: 'bg-violet-50 text-violet-600'},
    { label: 'Payroll',         href: '/admin/payroll',       icon: DollarSign,   iconClass: 'bg-emerald-50 text-emerald-600'},
    { label: 'Attendance',      href: '/admin/attendance',    icon: Clock,        iconClass: 'bg-rose-50 text-rose-600'    },
    { label: 'Announcements',   href: '/admin/announcements', icon: Megaphone,    iconClass: 'bg-indigo-50 text-indigo-600'},
  ]

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <WelcomeBanner
        name={user?.full_name || 'Admin'}
        role="Super Admin"
        message={
          pending > 0
            ? `${pending} leave request${pending > 1 ? 's' : ''} pending approval. ${lateToday > 0 ? `${lateToday} late arrivals today.` : ''}`
            : 'All leave requests are handled. Everything looks good!'
        }
        stats={[
          { label: 'Employees', value: employees.length },
          { label: 'Admins',    value: admins.length    },
          { label: 'Pending',   value: pending          },
          { label: 'Present',   value: presentToday     },
        ]}
      />

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={employees.length}
          sub={`${active} active · ${inactive} inactive`}
          icon={Users}
          iconClass="bg-blue-50 text-blue-600"
          trend={`${active} active now`}
          trendUp={active > inactive}
        />
        <StatCard
          title="Total Admins"
          value={admins.length}
          sub="Across all departments"
          icon={ShieldCheck}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Pending Leaves"
          value={pending}
          sub={`${approved} approved · ${rejected} rejected`}
          icon={CalendarDays}
          iconClass="bg-violet-50 text-violet-600"
          trend={pending > 0 ? `${pending} need action` : 'All clear'}
          trendUp={pending === 0}
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          sub={`${lateToday} late · ${todayRecs.filter(r => r.status === 'absent').length} absent`}
          icon={UserCheck}
          iconClass="bg-emerald-50 text-emerald-600"
          trend={`${Math.round((presentToday / (employees.length || 1)) * 100)}% attendance`}
          trendUp={presentToday > employees.length / 2}
        />
      </div>

      {/* Row 2: Attendance Trend (wide) + Leave Pie + Leave Type */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AttendanceTrendChart records={attendance} days={7} />
        </div>
        <LeavePieChart leaves={leaves} />
        <LeaveTypeChart leaves={leaves} />
      </div>

      {/* Row 3: Department Bar + Payroll Line */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DepartmentBarChart employees={employees} />
        <PayrollLineChart payslips={payslips} />
      </div>

      {/* Row 4: Pending Leaves Table (wide) + Recent Employees */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentLeavesTable leaves={leaves} limit={6} />
        </div>
        <RecentEmployeesTable employees={employees} limit={5} />
      </div>

      {/* Row 5: Quick Actions + Announcements */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QuickActions actions={quickActionsList} />
        <div className="lg:col-span-2">
          <AnnouncementsFeed announcements={announcements} limit={4} />
        </div>
      </div>

    </div>
  )
}
