'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'
import { PieChart, Pie, Cell, Label } from 'recharts'
import { LeaveRequest } from '@/types'
import { useMemo } from 'react'

interface Props {
  leaves: LeaveRequest[]
}

const chartConfig: ChartConfig = {
  pending:  { label: 'Pending',  color: '#f59e0b' },
  approved: { label: 'Approved', color: '#10b981' },
  rejected: { label: 'Rejected', color: '#ef4444' },
}

export function LeavePieChart({ leaves }: Props) {
  const data = useMemo(() => {
    const pending  = leaves.filter(l => l.status === 'pending').length
    const approved = leaves.filter(l => l.status === 'approved').length
    const rejected = leaves.filter(l => l.status === 'rejected').length
    return [
      { name: 'pending',  value: pending,  fill: '#f59e0b' },
      { name: 'approved', value: approved, fill: '#10b981' },
      { name: 'rejected', value: rejected, fill: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [leaves])

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Leave Status</CardTitle>
        <CardDescription className="text-xs">All-time breakdown</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} strokeWidth={2}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">{total}</tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-xs">Total</tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-2">
          {[
            { label: 'Pending',  color: '#f59e0b', count: leaves.filter(l => l.status === 'pending').length  },
            { label: 'Approved', color: '#10b981', count: leaves.filter(l => l.status === 'approved').length },
            { label: 'Rejected', color: '#ef4444', count: leaves.filter(l => l.status === 'rejected').length },
          ].map(({ label, color, count }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
              {label} <span className="font-semibold text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
