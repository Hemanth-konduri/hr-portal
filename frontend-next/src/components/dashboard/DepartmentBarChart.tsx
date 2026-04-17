'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from 'recharts'
import { User } from '@/types'
import { useMemo } from 'react'

interface Props {
  employees: User[]
}

const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#f97316', '#3b82f6', '#ec4899', '#14b8a6']

const chartConfig: ChartConfig = {
  count: { label: 'Employees', color: '#f59e0b' },
}

export function DepartmentBarChart({ employees }: Props) {
  const data = useMemo(() => {
    const map: Record<string, number> = {}
    employees.forEach(e => {
      const d = e.department || 'Unassigned'
      map[d] = (map[d] || 0) + 1
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([dept, count]) => ({ dept, count }))
  }, [employees])

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Department Headcount</CardTitle>
        <CardDescription className="text-xs">{employees.length} employees across departments</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} layout="vertical" barSize={14} margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="dept" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[0, 3, 3, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
