'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { AttendanceRecord, AttendanceStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard }            from '@/components/dashboard/StatCard'
import { AttendanceCalendar }  from '@/components/dashboard/AttendanceCalendar'
import { CheckInCard }         from '@/components/dashboard/CheckInCard'
import { AttendanceTrendChart } from '@/components/dashboard/AttendanceTrendChart'
import { UserCheck, UserX, Clock, AlertTriangle, TrendingUp, MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { attendanceDateKey, attendanceDisplayDate } from '@/lib/attendance-dates'

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  absent:   'bg-red-50 text-red-600 border-red-200',
  half_day: 'bg-amber-50 text-amber-700 border-amber-200',
  lop:      'bg-orange-50 text-orange-700 border-orange-200',
  holiday:  'bg-blue-50 text-blue-700 border-blue-200',
  weekend:  'bg-gray-100 text-gray-500 border-gray-200',
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

interface MonthlySummary {
  present: number; absent: number; half_day: number
  lop: number; late_count: number; total_overtime: number
}

interface TodayStatus {
  checked_in: boolean; checked_out: boolean
  check_in_time?: string; check_out_time?: string
  check_in_lat?: number; check_in_lng?: number
  is_late?: boolean; status?: AttendanceStatus
  notes?: string
}

export default function EmployeeAttendancePage() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year,  setYear]  = useState(String(now.getFullYear()))

  const [records,      setRecords]      = useState<AttendanceRecord[]>([])
  const [chartRecords, setChartRecords] = useState<AttendanceRecord[]>([])
  const [summary,      setSummary]      = useState<MonthlySummary | null>(null)
  const [today,        setToday]        = useState<TodayStatus>({ checked_in: false, checked_out: false })
  const [loading,      setLoading]      = useState(true)
  const [checkInKey,   setCheckInKey]   = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const now      = new Date()
      const from7    = format(subDays(now, 30), 'yyyy-MM-dd')
      const to7      = format(now, 'yyyy-MM-dd')

      const [recRes, sumRes, chartRes] = await Promise.all([
        api.get('/attendance/my', { params: { month, year } }),
        api.get('/attendance/my/summary', { params: { month, year } }),
        api.get('/attendance/my', { params: { from_date: from7, to_date: to7 } }),
      ])
      setRecords(recRes.data)
      setSummary(sumRes.data)
      setChartRecords(chartRes.data)

      // Set today's status
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
      // silent
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchData() }, [fetchData])

  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i))
  const attendedDays = (summary?.present ?? 0) + (summary?.half_day ?? 0)

  if (loading && records.length === 0 && !today.checked_in) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Check-in / Check-out Card */}
      <CheckInCard key={checkInKey} onRefresh={fetchData} />

      {/* Month/Year filter */}
      <div className="flex items-center gap-3">
        <p className="text-xs font-medium text-muted-foreground">Viewing:</p>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)} className="text-xs">{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { fetchData(); setCheckInKey(k => k + 1) }} className="gap-1.5 h-8 text-xs ml-auto">
          <RefreshCw size={12} /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Present"
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
          trend={summary?.late_count ? `${summary.late_count} late check-ins` : 'Perfect punctuality!'}
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

      {/* Calendar + Trend Chart side by side */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttendanceCalendar
          records={records}
          title="My Attendance Calendar"
          description={`${MONTHS[+month - 1]} ${year} — click any day for details`}
        />
        <AttendanceTrendChart records={chartRecords} days={7} />
      </div>

      {/* Detailed Records Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Attendance Records</CardTitle>
          <CardDescription className="text-xs">
            {MONTHS[+month - 1]} {year} — {records.length} records
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Check In</TableHead>
                  <TableHead className="text-xs">Check Out</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Late</TableHead>
                  <TableHead className="text-xs">Overtime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                      No attendance records for {MONTHS[+month - 1]} {year}
                    </TableCell>
                  </TableRow>
                ) : records.map(r => (
                  <TableRow key={r.id} className="text-sm">
                    <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">
                      {attendanceDisplayDate(r.date) ? format(attendanceDisplayDate(r.date)!, 'EEE, d MMM') : '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {r.check_in_time ? format(new Date(r.check_in_time), 'HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {r.check_out_time ? format(new Date(r.check_out_time), 'HH:mm') : '—'}
                    </TableCell>
                    <TableCell>
                      {r.notes || r.check_in_lat ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={10} className="text-blue-500 shrink-0" />
                          <span className="text-[11px] text-foreground">
                            {r.notes || `${Number(r.check_in_lat).toFixed(3)}, ${Number(r.check_in_lng).toFixed(3)}`}
                          </span>
                          {r.check_in_lat && (
                            <a
                              href={`https://www.google.com/maps?q=${r.check_in_lat},${r.check_in_lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-500 hover:underline shrink-0"
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] capitalize', STATUS_STYLES[r.status])}>
                        {r.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.is_late ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          Late
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-medium">On time</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.overtime_hours > 0 ? (
                        <span className="text-blue-600 font-medium">{r.overtime_hours}h</span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
