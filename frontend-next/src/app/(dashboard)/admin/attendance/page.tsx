'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { AttendanceRecord, AttendanceStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatCard } from '@/components/dashboard/StatCard'
import { AttendanceTrendChart } from '@/components/dashboard/AttendanceTrendChart'
import { Users, UserCheck, UserX, Clock, AlertTriangle, Search, Filter, Download, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

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

interface MonthlySummaryRow {
  id: number
  full_name: string
  employee_id: string
  department: string
  present: number
  absent: number
  half_day: number
  lop: number
  late_count: number
  overtime_hours: number
}

interface SummaryStats {
  total_employees: number
  present: number
  absent: number
  half_day: number
  lop: number
  late_count: number
  total_overtime: number
  total_records: number
}

export default function AdminAttendancePage() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year,  setYear]  = useState(String(now.getFullYear()))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lateFilter, setLateFilter] = useState('all')

  const [records,  setRecords]  = useState<AttendanceRecord[]>([])
  const [summary,  setSummary]  = useState<SummaryStats | null>(null)
  const [monthly,  setMonthly]  = useState<MonthlySummaryRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab, setTab] = useState('records')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { month, year }
      if (statusFilter !== 'all') params.status = statusFilter
      if (lateFilter === 'true')  params.is_late = 'true'
      if (lateFilter === 'false') params.is_late = 'false'

      const [recRes, sumRes, monRes] = await Promise.all([
        api.get('/attendance/all', { params }),
        api.get('/attendance/summary', { params: { month, year } }),
        api.get('/attendance/monthly-summary', { params: { month, year } }),
      ])
      setRecords(recRes.data)
      setSummary(sumRes.data)
      setMonthly(monRes.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [month, year, statusFilter, lateFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = records.filter(r => {
    const q = search.toLowerCase()
    return !q || r.full_name?.toLowerCase().includes(q) || r.employee_id?.toLowerCase().includes(q)
  })

  const years = Array.from({ length: 4 }, (_, i) => String(now.getFullYear() - i))
  const attendedDays = (summary?.present ?? 0) + (summary?.half_day ?? 0)

  const exportCSV = () => {
    const header = 'Employee,ID,Date,Check In,Check Out,Location,Status,Late,Overtime\n'
    const rows = filtered.map(r =>
      `"${r.full_name}","${r.employee_id}","${r.date}","${r.check_in_time || ''}","${r.check_out_time || ''}","${r.notes || ''}","${r.status}","${r.is_late ? 'Yes' : 'No'}","${r.overtime_hours}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${year}-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Attendance Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor and manage employee attendance records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 h-9">
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 h-9">
            <Download size={13} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Filter size={13} /> Filters
            </div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Status</SelectItem>
                <SelectItem value="present"  className="text-xs">Present</SelectItem>
                <SelectItem value="absent"   className="text-xs">Absent</SelectItem>
                <SelectItem value="half_day" className="text-xs">Half Day</SelectItem>
                <SelectItem value="lop"      className="text-xs">LOP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lateFilter} onValueChange={setLateFilter}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="Late Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"   className="text-xs">All</SelectItem>
                <SelectItem value="true"  className="text-xs">Late Only</SelectItem>
                <SelectItem value="false" className="text-xs">On Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total Records"
            value={summary?.total_records ?? 0}
            icon={Users}
            iconClass="bg-blue-50 text-blue-600"
            sub={`${summary?.total_employees ?? 0} employees tracked`}
          />
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
            sub={`${Number(summary?.total_overtime ?? 0).toFixed(1)}h total overtime`}
          />
        </div>
      )}

      {/* Trend Chart */}
      <AttendanceTrendChart records={records} days={7} />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-9">
          <TabsTrigger value="records"  className="text-xs">Daily Records</TabsTrigger>
          <TabsTrigger value="monthly"  className="text-xs">Monthly Summary</TabsTrigger>
        </TabsList>

        {/* Daily Records Tab */}
        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Attendance Records</CardTitle>
                  <CardDescription className="text-xs">{MONTHS[+month - 1]} {year}</CardDescription>
                </div>
                <div className="relative w-56">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search name or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs">Employee</TableHead>
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
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                            No attendance records found for the selected filters.
                          </TableCell>
                        </TableRow>
                      ) : filtered.map(r => (
                        <TableRow key={r.id} className="text-sm">
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground text-xs">{r.full_name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{r.employee_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {r.date ? format(parseISO(r.date), 'd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {r.check_in_time ? format(new Date(r.check_in_time), 'HH:mm') : '—'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {r.check_out_time ? format(new Date(r.check_out_time), 'HH:mm') : '—'}
                          </TableCell>
                          <TableCell className="max-w-[180px]">
                            {r.notes ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-foreground truncate" title={r.notes}>{r.notes}</span>
                                {r.check_in_lat && (
                                  <a href={`https://www.google.com/maps?q=${r.check_in_lat},${r.check_in_lng}`}
                                    target="_blank" rel="noreferrer"
                                    className="text-[10px] text-blue-500 hover:underline shrink-0">↗</a>
                                )}
                              </div>
                            ) : r.check_in_lat ? (
                              <a href={`https://www.google.com/maps?q=${r.check_in_lat},${r.check_in_lng}`}
                                target="_blank" rel="noreferrer"
                                className="text-[10px] text-blue-500 hover:underline">
                                {Number(r.check_in_lat).toFixed(4)}, {Number(r.check_in_lng).toFixed(4)}
                              </a>
                            ) : <span className="text-[10px] text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] capitalize', STATUS_STYLES[r.status])}>
                              {r.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {r.is_late ? (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Late</Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">On time</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.overtime_hours > 0 ? `${r.overtime_hours}h` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!loading && filtered.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-right px-4 py-2">
                  Showing {filtered.length} of {records.length} records
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Summary Tab */}
        <TabsContent value="monthly" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Monthly Summary per Employee</CardTitle>
              <CardDescription className="text-xs">{MONTHS[+month - 1]} {year} — aggregated per employee</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs">Employee</TableHead>
                        <TableHead className="text-xs">Department</TableHead>
                        <TableHead className="text-xs text-center">Present</TableHead>
                        <TableHead className="text-xs text-center">Absent</TableHead>
                        <TableHead className="text-xs text-center">Half Day</TableHead>
                        <TableHead className="text-xs text-center">LOP</TableHead>
                        <TableHead className="text-xs text-center">Late</TableHead>
                        <TableHead className="text-xs text-center">Overtime</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthly.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                            No data for the selected period.
                          </TableCell>
                        </TableRow>
                      ) : monthly.map(row => (
                        <TableRow key={row.id} className="text-sm">
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground text-xs">{row.full_name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{row.employee_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{row.department || '—'}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs font-semibold text-emerald-600">{row.present ?? 0}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs font-semibold text-red-500">{row.absent ?? 0}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs font-semibold text-amber-600">{row.half_day ?? 0}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs font-semibold text-orange-600">{row.lop ?? 0}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {row.late_count > 0 ? (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                                {row.late_count}
                              </Badge>
                            ) : <span className="text-xs text-muted-foreground">0</span>}
                          </TableCell>
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {row.overtime_hours > 0 ? `${row.overtime_hours}h` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
