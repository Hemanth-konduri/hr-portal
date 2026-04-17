'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import { Payslip } from '@/types'
import { useMemo } from 'react'

interface Props {
  payslips: Payslip[]
}

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const chartConfig: ChartConfig = {
  net:   { label: 'Net Salary',   color: '#10b981' },
  gross: { label: 'Gross Salary', color: '#f59e0b' },
  lop:   { label: 'LOP Deducted', color: '#ef4444' },
}

export function PayrollLineChart({ payslips }: Props) {
  const data = useMemo(() => {
    const map: Record<string, { gross: number; net: number; lop: number; count: number }> = {}
    payslips.forEach(p => {
      const key = `${MONTHS[p.month]} ${p.year}`
      if (!map[key]) map[key] = { gross: 0, net: 0, lop: 0, count: 0 }
      map[key].gross += Number(p.gross_salary)
      map[key].net   += Number(p.net_salary)
      map[key].lop   += Number(p.lop_deduction)
      map[key].count++
    })
    return Object.entries(map)
      .slice(-6)
      .map(([month, v]) => ({
        month,
        gross: Math.round(v.gross),
        net:   Math.round(v.net),
        lop:   Math.round(v.lop),
      }))
  }, [payslips])

  const fmt = (v: number) => `₹${(v / 1000).toFixed(0)}k`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Payroll Trend</CardTitle>
        <CardDescription className="text-xs">Monthly gross vs net salary (last 6 months)</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="gross" stroke="var(--color-gross)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="net"   stroke="var(--color-net)"   strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="lop"   stroke="var(--color-lop)"   strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
