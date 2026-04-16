'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from '@/components/ui/chart'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

import { AttendanceRecord } from '@/types'
import { useMemo } from 'react'
import { format, subDays, startOfDay } from 'date-fns'
import { attendanceDateKey } from '@/lib/attendance-dates'

interface Props {
  records: AttendanceRecord[]
  days?: number
}

const chartConfig: ChartConfig = {
  present: { label: 'Present', color: '#f59e0b' },
  absent: { label: 'Absent', color: '#e5e7eb' },
  late: { label: 'Late', color: '#f97316' },
}

export function AttendanceTrendChart({ records, days = 7 }: Props) {
  const data = useMemo(() => {
  return Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i))
    const dateStr = format(date, 'yyyy-MM-dd')

    const dayRecords = records.filter(
      (r) =>
        format(startOfDay(new Date(r.date)), 'yyyy-MM-dd') === dateStr
    )

    return {
      day: format(date, 'EEE'),
      date: dateStr,
      present: dayRecords.filter(
        (r) => r.status === 'present' && !r.is_late
      ).length,
      absent: dayRecords.filter((r) => r.status === 'absent').length,
      late: dayRecords.filter((r) => r.is_late).length,
    }
  })
}, [records, days])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          Attendance Trend
        </CardTitle>
        <CardDescription className="text-xs">
          Last {days} days — present vs absent
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="w-full h-[220px]">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={data}
      barSize={18}
      margin={{ top: 10, right: 10, left: 10, bottom: -10 }}
    >
              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.4}
              />

              {/* ✅ FIXED X-AXIS */}
              <XAxis
                dataKey="day"
                interval={0}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              {/* ✅ FIXED Y-AXIS */}
              <YAxis
                width={40}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />

              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />

              {/* ✅ STACKED BARS (clean UI) */}
              <Bar
                dataKey="present"
                stackId="a"
                fill="var(--color-present)"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="late"
                stackId="a"
                fill="var(--color-late)"
              />

              <Bar
                dataKey="absent"
                stackId="a"
                fill="var(--color-absent)"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}