'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { Payslip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/dashboard/StatCard'
import { toast } from 'sonner'
import { DollarSign, TrendingDown, CalendarDays, Eye, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

interface MyPayslip extends Payslip {
  basic?: number
  hra?: number
  allowances?: number
}

export default function EmployeePayslipsPage() {
  const now = new Date()
  const [payslips,   setPayslips]   = useState<MyPayslip[]>([])
  const [loading,    setLoading]    = useState(true)
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()))
  const [selected,   setSelected]   = useState<MyPayslip | null>(null)

  const years = Array.from({ length: 4 }, (_, i) => String(now.getFullYear() - i))

  const fetchPayslips = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/payslips/my')
      setPayslips(data)
    } catch {
      toast.error('Failed to load payslips')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayslips() }, [fetchPayslips])

  const displayYear  = Number(yearFilter)
  const maxMonth     = displayYear === now.getFullYear() ? now.getMonth() + 1 : 12
  const monthsGrid   = Array.from({ length: maxMonth }, (_, i) => i + 1).reverse()
  const filtered     = payslips.filter(p => p.year === displayYear)
  const slipByMonth  = new Map(filtered.map(p => [p.month, p]))

  const latestSlip = payslips[0]
  const totalNet   = filtered.reduce((s, p) => s + Number(p.net_salary), 0)
  const totalLop   = filtered.reduce((s, p) => s + Number(p.lop_days), 0)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Payslips</h1>
          <p className="text-xs text-muted-foreground mt-0.5">View your monthly salary statements</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayslips} className="gap-2 h-9">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            title="Latest Net Salary"
            value={latestSlip ? `₹${Number(latestSlip.net_salary).toLocaleString()}` : '—'}
            icon={DollarSign}
            iconClass="bg-emerald-50 text-emerald-600"
            sub={latestSlip ? `${MONTHS[latestSlip.month - 1]} ${latestSlip.year}` : 'No payslips yet'}
          />
          <StatCard
            title="Total Earned"
            value={`₹${totalNet.toLocaleString()}`}
            icon={DollarSign}
            iconClass="bg-blue-50 text-blue-600"
            sub={`${filtered.length} payslip${filtered.length !== 1 ? 's' : ''} in ${displayYear}`}
          />
          <StatCard
            title="Total LOP Days"
            value={totalLop}
            icon={TrendingDown}
            iconClass="bg-red-50 text-red-500"
            sub={`Loss of pay in ${displayYear}`}
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <CalendarDays size={14} className="text-muted-foreground" />
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} of {maxMonth} months generated
        </span>
      </div>

      {/* Payslips Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Payslip History</CardTitle>
          <CardDescription className="text-xs">
            {displayYear} — click the eye icon to view full breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs">Month</TableHead>
                    <TableHead className="text-xs text-right">Basic</TableHead>
                    <TableHead className="text-xs text-right">HRA</TableHead>
                    <TableHead className="text-xs text-right">Allowances</TableHead>
                    <TableHead className="text-xs text-right">Gross</TableHead>
                    <TableHead className="text-xs text-center">LOP Days</TableHead>
                    <TableHead className="text-xs text-right">Deduction</TableHead>
                    <TableHead className="text-xs text-right">Net Salary</TableHead>
                    <TableHead className="text-xs w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthsGrid.map(m => {
                    const slip      = slipByMonth.get(m)
                    const isCurrent = m === now.getMonth() + 1 && displayYear === now.getFullYear()

                    if (!slip) {
                      return (
                        <TableRow key={m} className="hover:bg-muted/20">
                          <TableCell className="text-xs font-semibold text-foreground">
                            {MONTHS[m - 1]} {displayYear}
                          </TableCell>
                          <TableCell colSpan={7} className="text-center">
                            <span className={cn(
                              'inline-flex items-center gap-1.5 text-xs',
                              isCurrent ? 'text-amber-600' : 'text-muted-foreground italic'
                            )}>
                              {isCurrent && <AlertCircle size={11} />}
                              {isCurrent ? 'Payslip not generated yet for this month' : 'Not generated'}
                            </span>
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      )
                    }

                    return (
                      <TableRow
                        key={m}
                        className="text-sm cursor-pointer hover:bg-muted/30"
                        onClick={() => setSelected(slip)}
                      >
                        <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">
                          {MONTHS[m - 1]} {displayYear}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-muted-foreground">
                          {slip.basic != null ? `₹${Number(slip.basic).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-muted-foreground">
                          {slip.hra != null ? `₹${Number(slip.hra).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-muted-foreground">
                          {slip.allowances != null ? `₹${Number(slip.allowances).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-muted-foreground">
                          ₹{Number(slip.gross_salary).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {slip.lop_days > 0 ? (
                            <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                              {slip.lop_days}d
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right font-mono text-red-500">
                          {slip.lop_deduction > 0 ? `-₹${Number(slip.lop_deduction).toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold text-foreground">
                            ₹{Number(slip.net_salary).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={e => { e.stopPropagation(); setSelected(slip) }}
                          >
                            <Eye size={13} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {monthsGrid.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-16 text-center text-sm text-muted-foreground">
                        No data for {displayYear}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              Payslip — {selected ? `${MONTHS[selected.month - 1]} ${selected.year}` : ''}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Earnings */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Earnings</p>
                {[
                  { label: 'Basic Salary', value: selected.basic },
                  { label: 'HRA',          value: selected.hra },
                  { label: 'Allowances',   value: selected.allowances },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-mono font-medium">
                      {row.value != null ? `₹${Number(row.value).toLocaleString()}` : '—'}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Gross Salary</span>
                  <span className="font-mono">₹{Number(selected.gross_salary).toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Deductions</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">LOP ({selected.lop_days} days)</span>
                  <span className="font-mono text-red-500">
                    {selected.lop_deduction > 0 ? `-₹${Number(selected.lop_deduction).toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Net */}
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm font-semibold">Net Salary</span>
                <span className="text-xl font-bold">₹{Number(selected.net_salary).toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
