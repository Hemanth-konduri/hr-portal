'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api/axios'
import { AttendanceRecord, AttendanceStatus, LeaveRequest, LeaveBalance, Announcement } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/dashboard/StatCard'
import { AttendanceTrendChart } from '@/components/dashboard/AttendanceTrendChart'
import { AnnouncementsFeed } from '@/components/dashboard/AnnouncementsFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { CheckInCard } from '@/components/dashboard/CheckInCard'
import { AttendanceCalendar } from '@/components/dashboard/AttendanceCalendar'
import { toast } from 'sonner'
import {
  LogIn, LogOut, UserCheck, UserX, Clock,
  AlertTriangle, TrendingUp, CalendarDays,
  DollarSign, Award, FileText, Megaphone,
  CheckCircle2, XCircle, Pin,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { attendanceDateKey } from '@/lib/attendance-dates'

// ── Types ─────────────────────────────────────────────────────
interface MonthlySummary {
  present: number
  absent: number
  half_day: number
  lop: number
  late_count: number
  total_overtime: number
}

interface TodayStatus {
  checked_in: boolean
  checked_out: boolean
  check_in_time?: string
  check_out_time?: string
  check_in_lat?: number
  check_in_lng?: number
  is_late?: boolean
  status?: AttendanceStatus
  notes?: string
}

interface MyPayslip {
  id: number
  month: number
  year: number
  gross_salary: number
  lop_days: number
  lop_deduction: number
  net_salary: number
  basic?: number
  hra?: number
  allowances?: number
}

const MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
]

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  absent:   'bg-red-50 text-red-600 border-red-200',
  half_day: 'bg-amber-50 text-amber-700 border-amber-200',
  lop:      'bg-orange-50 text-orange-700 border-orange-200',
  holiday:  'bg-blue-50 text-blue-700 border-blue-200',
  weekend:  'bg-gray-100 text-gray-500 border-gray-200',
}

// ── Skeleton ──────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-56" />)}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuth()
  const now = new Date()

  const [records,       setRecords]       = useState<AttendanceRecord[]>([])
  const [summary,       setSummary]       = useState<MonthlySummary | null>(null)
  const [today,         setToday]         = useState<TodayStatus>({ checked_in: false, checked_out: false })
  const [leaves,        setLeaves]        = useState<LeaveRequest[]>([])
  const [balance,       setBalance]       = useState<LeaveBalance | null>(null)
  const [payslips,      setPayslips]      = useState<MyPayslip[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const month = String(now.getMonth() + 1)
  const year  = String(now.getFullYear())

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [recRes, sumRes, leavesRes, balRes, payRes, annRes] = await Promise.all([
        api.get('/attendance/my', { params: { month, year } }).catch(() => ({ data: [] })),
        api.get('/attendance/my/summary', { params: { month, year } }).catch(() => ({ data: null })),
        api.get('/leaves/my').catch(() => ({ data: [] })),
        api.get('/leaves/balance').catch(() => ({ data: null })),
        api.get('/payslips/my').catch(() => ({ data: [] })),
        api.get('/announcements').catch(() => ({ data: [] })),
      ])

      setRecords(recRes.data)
      setSummary(sumRes.data)
      setLeaves(leavesRes.data)
      setBalance(balRes.data)
      setPayslips(payRes.data)
      setAnnouncements(annRes.data)

      const todayStr = format(now, 'yyyy-MM-dd')
      const todayRec = recRes.data.find((r: AttendanceRecord) => attendanceDateKey(r.date) === todayStr)
      if (todayRec) {
        setToday({
          checked_in:     true,
          checked_out:    !!todayRec.check_out_time,
          check_in_time:  todayRec.check_in_time,
          check_out_time: todayRec.check_out_time,
          check_in_lat:   todayRec.check_in_lat,
          check_in_lng:   todayRec.check_in_lng,
          is_late:        todayRec.is_late,
          status:         todayRec.status,
          notes:          todayRec.notes,
        })
      } else {
        setToday({ checked_in: false, checked_out: false })
      }
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Check-in / Check-out ──────────────────────────────────
  const doCheckIn = async () => {
    setActionLoading(true)
    const call = async (lat?: number, lng?: number) => {
      try {
        const res = await api.post('/attendance/checkin', lat ? { latitude: lat, longitude: lng } : {})
        toast.success(res.data.isLate ? 'Checked in — marked as late' : 'Checked in successfully!')
        fetchAll()
      } catch (err: any) {
        toast.error(err.response?.data?.msg || 'Check-in failed')
      } finally {
        setActionLoading(false)
      }
    }
    navigator.geolocation?.getCurrentPosition(
      p => call(p.coords.latitude, p.coords.longitude),
      () => call(),
    ) ?? call()
  }

  const doCheckOut = async () => {
    setActionLoading(true)
    const call = async (lat?: number, lng?: number) => {
      try {
        const res = await api.post('/attendance/checkout', lat ? { latitude: lat, longitude: lng } : {})
        toast.success(
          res.data.overtimeHours > 0
            ? `Checked out — ${res.data.overtimeHours}h overtime logged`
            : 'Checked out successfully!'
        )
        fetchAll()
      } catch (err: any) {
        toast.error(err.response?.data?.msg || 'Check-out failed')
      } finally {
        setActionLoading(false)
      }
    }
    navigator.geolocation?.getCurrentPosition(
      p => call(p.coords.latitude, p.coords.longitude),
      () => call(),
    ) ?? call()
  }

  // ── Derived ───────────────────────────────────────────────
  const latestPayslip  = payslips[0] ?? null
  const pendingLeaves  = leaves.filter(l => l.status === 'pending').length
  const approvedLeaves = leaves.filter(l => l.status === 'approved').length
  const attendedDays   = (summary?.present ?? 0) + (summary?.half_day ?? 0)

  const greeting = () => {
    const h = now.getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const quickActionsList = [
    { label: 'Attendance',    href: '/employee/attendance',    icon: Clock,        iconClass: 'bg-emerald-50 text-emerald-600' },
    { label: 'My Leaves',     href: '/employee/leaves',        icon: CalendarDays, iconClass: 'bg-violet-50 text-violet-600'   },
    { label: 'Payslips',      href: '/employee/payslips',      icon: DollarSign,   iconClass: 'bg-amber-50 text-amber-600'     },
    { label: 'Announcements', href: '/employee/announcements', icon: Megaphone,    iconClass: 'bg-indigo-50 text-indigo-600'   },
    { label: 'Performance',   href: '/employee/performance',   icon: Award,        iconClass: 'bg-rose-50 text-rose-600'       },
    { label: 'Documents',     href: '/employee/documents',     icon: FileText,     iconClass: 'bg-blue-50 text-blue-600'       },
  ]

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">

      {/* ── Welcome Banner ─────────────────────────────────── */}
      <Card className="border-0 bg-[#0f0f13] text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.12),_transparent_55%)] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(ellipse,_rgba(99,102,241,0.08),_transparent_70%)] pointer-events-none" />
        <CardContent className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              {greeting()}, Employee
            </p>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {user?.full_name?.split(' ')[0]} 👋
            </h2>
            <p className="text-sm text-white/50 max-w-sm leading-relaxed">
              {!today.checked_in
                ? "You haven't checked in yet today. Don't forget!"
                : today.checked_out
                  ? 'Attendance complete for today. Great work!'
                  : `Checked in at ${today.check_in_time ? format(new Date(today.check_in_time), 'HH:mm') : '—'}${today.is_late ? ' · Late' : ''}`
              }
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Present',  value: attendedDays            },
              { label: 'Leaves',   value: leaves.length           },
              { label: 'Pending',  value: pendingLeaves           },
              { label: 'Overtime', value: `${Number(summary?.total_overtime ?? 0).toFixed(0)}h` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 min-w-[72px]">
                <p className="text-xl font-bold text-amber-400 leading-none">{value}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Check-in / Check-out Card ──────────────────────── */}
      <CheckInCard onRefresh={fetchAll} />

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Present This Month"
          value={attendedDays}
          icon={UserCheck}
          iconClass="bg-emerald-50 text-emerald-600"
          sub={`${summary?.half_day ?? 0} half days`}
        />
        <StatCard
          title="Absent / LOP"
          value={(summary?.absent ?? 0) + (summary?.lop ?? 0)}
          icon={UserX}
          iconClass="bg-red-50 text-red-500"
          sub={`${summary?.absent ?? 0} absent · ${summary?.lop ?? 0} LOP`}
        />
        <StatCard
          title="Late Arrivals"
          value={summary?.late_count ?? 0}
          icon={AlertTriangle}
          iconClass="bg-amber-50 text-amber-600"
          sub="This month"
          trend={summary?.late_count ? `${summary.late_count} late check-ins` : 'Perfect punctuality'}
          trendUp={!summary?.late_count}
        />
        <StatCard
          title="Overtime"
          value={`${Number(summary?.total_overtime ?? 0).toFixed(1)}h`}
          icon={TrendingUp}
          iconClass="bg-blue-50 text-blue-600"
          sub="Total this month"
        />
      </div>

      {/* ── Leave Balance + Latest Payslip + Pending Leaves ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Casual Leave Balance */}
        <Card className="border-2 border-indigo-100">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <CalendarDays size={15} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Leave Balance</CardTitle>
                <CardDescription className="text-xs">Current year entitlement</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Casual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Casual Leave</span>
                <span className="text-xs font-semibold text-indigo-600">
                  {balance?.casual_remaining ?? 0} / {balance?.casual_total ?? 1} remaining
                </span>
              </div>
              <Progress
                value={((balance?.casual_used ?? 0) / (balance?.casual_total ?? 1)) * 100}
                className="h-2"
              />
              <p className="text-[10px] text-muted-foreground">
                {balance?.casual_used ?? 0} used · {balance?.casual_remaining ?? 0} available
              </p>
            </div>
            <Separator />
            {/* LOP */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="text-orange-500" />
                <span className="text-xs text-muted-foreground">Loss of Pay (LOP)</span>
              </div>
              <span className="text-sm font-bold text-orange-600">{balance?.lop_count ?? 0} days</span>
            </div>
            <Separator />
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Pending',  value: pendingLeaves,  color: 'text-amber-600'   },
                { label: 'Approved', value: approvedLeaves, color: 'text-emerald-600' },
                { label: 'Total',    value: leaves.length,  color: 'text-foreground'  },
              ].map(s => (
                <div key={s.label} className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latest Payslip */}
        <Card className="border-2 border-emerald-100">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <DollarSign size={15} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Latest Payslip</CardTitle>
                <CardDescription className="text-xs">
                  {latestPayslip ? `${MONTHS[latestPayslip.month - 1]} ${latestPayslip.year}` : 'No payslips yet'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!latestPayslip ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <DollarSign size={28} className="opacity-20" />
                <p className="text-xs">No payslip generated yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Basic',      value: latestPayslip.basic,      color: 'text-foreground'  },
                  { label: 'HRA',        value: latestPayslip.hra,        color: 'text-foreground'  },
                  { label: 'Allowances', value: latestPayslip.allowances, color: 'text-foreground'  },
                  { label: 'Gross',      value: latestPayslip.gross_salary, color: 'text-foreground', bold: true },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={cn('font-mono', row.bold ? 'font-semibold' : '', row.color)}>
                      {row.value != null ? `₹${Number(row.value).toLocaleString()}` : '—'}
                    </span>
                  </div>
                ))}
                {latestPayslip.lop_deduction > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">LOP ({latestPayslip.lop_days}d)</span>
                    <span className="font-mono text-red-500">-₹{Number(latestPayslip.lop_deduction).toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
                  <span className="text-xs font-semibold text-emerald-800">Net Salary</span>
                  <span className="text-lg font-bold text-emerald-700">
                    ₹{Number(latestPayslip.net_salary).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leave Requests */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <CalendarDays size={15} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Recent Leaves</CardTitle>
                <CardDescription className="text-xs">{leaves.length} total requests</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <CalendarDays size={28} className="opacity-20" />
                <p className="text-xs">No leave requests yet</p>
              </div>
            ) : (
              leaves.slice(0, 4).map(l => (
                <div key={l.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground capitalize">{l.leave_type} leave</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(l.from_date), 'd MMM')} – {format(parseISO(l.to_date), 'd MMM')} · {l.total_days}d
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px] capitalize shrink-0 flex items-center gap-1',
                    l.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    l.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                              'bg-amber-50 text-amber-700 border-amber-200'
                  )}>
                    {l.status === 'approved' ? <CheckCircle2 size={9} /> :
                     l.status === 'rejected' ? <XCircle size={9} /> :
                                               <Clock size={9} />}
                    {l.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Attendance Trend Chart ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AttendanceCalendar records={records} title="My Attendance Calendar" />
        <AttendanceTrendChart records={records} days={7} />
      </div>

      {/* ── Quick Actions + Announcements ──────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QuickActions actions={quickActionsList} />
        <div className="lg:col-span-2">
          <AnnouncementsFeed
            announcements={announcements}
            limit={4}
            showLink
            linkHref="/employee/announcements"
          />
        </div>
      </div>

    </div>
  )
}
