'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AttendanceRecord, AttendanceStatus } from '@/types'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isToday,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { attendanceDateKey } from '@/lib/attendance-dates'

// ── Color config per status ───────────────────────────────────
const STATUS_CONFIG: Record<AttendanceStatus | 'no_record', {
  bg: string; text: string; border: string; dot: string; label: string
}> = {
  present:   { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500',  label: 'Present'   },
  absent:    { bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300',     dot: 'bg-red-500',      label: 'Absent'    },
  half_day:  { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   dot: 'bg-amber-500',    label: 'Half Day'  },
  lop:       { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-300',  dot: 'bg-orange-500',   label: 'LOP'       },
  holiday:   { bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    dot: 'bg-blue-500',     label: 'Holiday'   },
  weekend:   { bg: 'bg-gray-100',    text: 'text-gray-500',    border: 'border-gray-200',    dot: 'bg-gray-400',     label: 'Weekend'   },
  no_record: { bg: 'bg-transparent', text: 'text-muted-foreground', border: 'border-transparent', dot: 'bg-transparent', label: 'No Record' },
}

interface Props {
  records: AttendanceRecord[]
  title?: string
  description?: string
}

export function AttendanceCalendar({ records, title = 'Attendance Calendar', description }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const goToday   = () => setCurrentDate(new Date())

  // Build a map of date → record for O(1) lookup
  const recordMap = useMemo(() => {
    const map: Record<string, AttendanceRecord> = {}
    records.forEach(r => {
      if (r.date) {
        const key = attendanceDateKey(r.date)
        map[key] = r
      }
    })
    return map
  }, [records])

  // All days in the current month
  const days = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end   = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Leading empty cells (Mon = 0 offset)
  const startOffset = useMemo(() => {
    const day = getDay(startOfMonth(currentDate))
    return day === 0 ? 6 : day - 1 // make Monday = 0
  }, [currentDate])

  // Monthly summary counts
  const summary = useMemo(() => {
    const counts: Record<string, number> = { present: 0, absent: 0, half_day: 0, lop: 0, late: 0 }
    days.forEach(day => {
      const key = format(day, 'yyyy-MM-dd')
      const rec = recordMap[key]
      if (rec) {
        if (rec.status in counts) counts[rec.status]++
        if (rec.is_late) counts.late++
      }
    })
    return counts
  }, [days, recordMap])

  const getStatusForDay = (day: Date): AttendanceStatus | 'no_record' => {
    const key = format(day, 'yyyy-MM-dd')
    const rec = recordMap[key]
    if (!rec) {
      // Future days or today with no record — don't mark absent
      if (day > new Date()) return 'no_record'
      const dayOfWeek = getDay(day)
      if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend'
      return 'no_record'
    }
    return rec.status
  }

  const getTooltipContent = (day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    const rec = recordMap[key]
    if (!rec) return null
    return {
      checkIn:  rec.check_in_time  ? format(new Date(rec.check_in_time),  'HH:mm') : null,
      checkOut: rec.check_out_time ? format(new Date(rec.check_out_time), 'HH:mm') : null,
      isLate:   rec.is_late,
      overtime: rec.overtime_hours,
      status:   rec.status,
    }
  }

  const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <CardDescription className="text-xs">
              {description || `${format(currentDate, 'MMMM yyyy')} attendance overview`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={goToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        {/* Month + Year label */}
        <p className="text-base font-bold text-foreground mt-1">
          {format(currentDate, 'MMMM yyyy')}
        </p>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { key: 'present',  label: 'Present',  color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
            { key: 'absent',   label: 'Absent',   color: 'bg-red-100 text-red-700 border-red-200'             },
            { key: 'half_day', label: 'Half Day', color: 'bg-amber-100 text-amber-800 border-amber-200'       },
            { key: 'lop',      label: 'LOP',      color: 'bg-orange-100 text-orange-800 border-orange-200'    },
            { key: 'late',     label: 'Late',     color: 'bg-yellow-100 text-yellow-800 border-yellow-200'    },
          ].map(({ key, label, color }) => (
            <Badge key={key} variant="outline" className={cn('text-[10px] gap-1', color)}>
              {label}: <span className="font-bold">{summary[key] ?? 0}</span>
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <TooltipProvider delayDuration={100}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className={cn(
                'text-center text-[10px] font-semibold uppercase tracking-wider py-1',
                d === 'Sat' || d === 'Sun' ? 'text-muted-foreground/50' : 'text-muted-foreground'
              )}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Leading empty cells */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {days.map(day => {
              const status  = getStatusForDay(day)
              const config  = STATUS_CONFIG[status]
              const tooltip = getTooltipContent(day)
              const isCurrentDay = isToday(day)
              const isFuture = day > new Date()

              return (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      'relative flex flex-col items-center justify-center rounded-lg border p-1.5 cursor-default transition-all',
                      'min-h-[44px] text-xs font-medium',
                      isFuture || status === 'no_record'
                        ? 'bg-transparent border-transparent text-muted-foreground/40'
                        : cn(config.bg, config.text, config.border),
                      isCurrentDay && 'ring-2 ring-offset-1 ring-foreground/30',
                    )}>
                      <span className={cn(
                        'text-xs font-semibold leading-none',
                        isCurrentDay && 'font-bold'
                      )}>
                        {format(day, 'd')}
                      </span>

                      {/* Late indicator dot */}
                      {tooltip?.isLate && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-yellow-500" />
                      )}

                      {/* Check-in time */}
                      {tooltip?.checkIn && (
                        <span className="text-[9px] leading-none mt-0.5 opacity-70 font-mono">
                          {tooltip.checkIn}
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>

                  {tooltip && (
                    <TooltipContent side="top" className="text-xs space-y-1 p-3 max-w-[180px]">
                      <p className="font-semibold">{format(day, 'd MMMM yyyy')}</p>
                      <p className="capitalize text-muted-foreground">
                        Status: <span className="font-medium text-foreground">{tooltip.status.replace('_', ' ')}</span>
                      </p>
                      {tooltip.checkIn && (
                        <p className="text-muted-foreground">
                          In: <span className="font-mono font-medium text-foreground">{tooltip.checkIn}</span>
                          {tooltip.isLate && <span className="ml-1 text-yellow-600 font-semibold">· Late</span>}
                        </p>
                      )}
                      {tooltip.checkOut && (
                        <p className="text-muted-foreground">
                          Out: <span className="font-mono font-medium text-foreground">{tooltip.checkOut}</span>
                        </p>
                      )}
                      {tooltip.overtime > 0 && (
                        <p className="text-muted-foreground">
                          Overtime: <span className="font-medium text-foreground">{tooltip.overtime}h</span>
                        </p>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
            {Object.entries(STATUS_CONFIG)
              .filter(([k]) => k !== 'no_record')
              .map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className={cn('h-2.5 w-2.5 rounded-sm border', cfg.bg, cfg.border)} />
                  {cfg.label}
                </div>
              ))}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              Late
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
