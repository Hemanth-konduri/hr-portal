'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { LeaveRequest } from '@/types'
import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'

interface Props {
  leaves: LeaveRequest[]
}

const chartConfig: ChartConfig = {
  casual: { label: 'Casual Leave', color: '#6366f1' },
  lop:    { label: 'LOP',          color: '#f97316' },
}

export function LeaveTypeChart({ leaves }: Props) {
  const data = useMemo(() => {
    const map: Record<string, { casual: number; lop: number }> = {}
    leaves.forEach(l => {
      try {
        const month = format(parseISO(l.created_at), 'MMM yy')
        if (!map[month]) map[month] = { casual: 0, lop: 0 }
        if (l.leave_type === 'casual') map[month].casual++
        else map[month].lop++
      } catch {}
    })
    return Object.entries(map).slice(-6).map(([month, v]) => ({ month, ...v }))
  }, [leaves])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Leave Type Breakdown</CardTitle>
        <CardDescription className="text-xs">Casual vs LOP per month</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} barSize={14} barGap={3}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="casual" fill="var(--color-casual)" radius={[3, 3, 0, 0]} stackId="a" />
            <Bar dataKey="lop"    fill="var(--color-lop)"    radius={[3, 3, 0, 0]} stackId="a" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
