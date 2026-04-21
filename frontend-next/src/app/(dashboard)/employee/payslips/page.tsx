'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { Payslip } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { DollarSign, TrendingDown, TrendingUp, RefreshCw, Eye, CalendarDays, Banknote, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface MyPayslip extends Payslip {
  basic?: number
  hra?: number
  allowances?: number
}

export default function EmployeePayslipsPage() {
  const now = new Date()
  const [payslips, setPayslips]     = useState<MyPayslip[]>([])
  const [loading,  setLoading]      = useState(true)
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()))
  const [selected, setSelected]     = useState<MyPayslip | null>(null)

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

  const latestSlip   = payslips[0]
  const totalNet     = filtered.reduce((s, p) => s + Number(p.net_salary), 0)
  const totalLop     = filtered.reduce((s, p) => s + Number(p.lop_days), 0)

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Payslips</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your monthly salary statements</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPayslips} className="gap-2 h-9">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* ── Hero summary banner ─────────────────────────────── */}
      {loading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white">
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-100/70">Latest Net Salary</p>
              <p className="text-4xl font-bold mt-1">
                {latestSlip ? `₹${Number(latestSlip.net_salary).toLocaleString()}` : '—'}
              </p>
              <p className="text-sm text-emerald-100/60 mt-1">
                {latestSlip ? `${MONTHS[latestSlip.month - 1]} ${latestSlip.year}` : 'No payslips generated yet'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center min-w-[90px]">
                <p className="text-xl font-bold">₹{totalNet > 0 ? (totalNet / 1000).toFixed(0) + 'K' : '0'}</p>
                <p className="text-[10px] text-emerald-100/60 uppercase tracking-wide mt-0.5">Earned {displayYear}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3 text-center min-w-[90px]">
                <p className="text-xl font-bold">{filtered.length}</p>
                <p className="text-[10px] text-emerald-100/60 uppercase tracking-wide mt-0.5">Payslips</p>
              </div>
              {totalLop > 0 && (
                <div className="rounded-xl bg-red-500/30 px-4 py-3 text-center min-w-[90px]">
                  <p className="text-xl font-bold">{totalLop}d</p>
                  <p className="text-[10px] text-emerald-100/60 uppercase tracking-wide mt-0.5">LOP Days</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Year filter ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <CalendarDays size={14} className="text-muted-foreground" />
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="h-9 w-36 text-sm font-medium"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={y} className="text-sm">{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} of {maxMonth} months generated</span>
      </div>

      {/* ── Month cards grid ────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {monthsGrid.map(m => {
            const slip      = slipByMonth.get(m)
            const isCurrent = m === now.getMonth() + 1 && displayYear === now.getFullYear()

            if (!slip) {
              return (
                <div
                  key={m}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border-2 border-dashed px-4 py-4',
                    isCurrent ? 'border-amber-200 bg-amber-50/40' : 'border-muted bg-muted/20'
                  )}
                >
                  <div className={cn(
                    'flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl',
                    isCurrent ? 'bg-amber-100 text-amber-600' : 'bg-muted text-muted-foreground'
                  )}>
                    <span className="text-[11px] font-bold leading-none">{MONTHS_SHORT[m - 1]}</span>
                    <span className="text-[10px] leading-none mt-0.5 opacity-70">{displayYear}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', isCurrent ? 'text-amber-700' : 'text-muted-foreground')}>
                      {isCurrent ? 'Not generated yet' : 'Not generated'}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {isCurrent ? 'Payslip will appear once processed' : 'No payslip for this month'}
                    </p>
                  </div>
                  {isCurrent && (
                    <AlertCircle size={16} className="text-amber-400 shrink-0" />
                  )}
                </div>
              )
            }

            return (
              <div
                key={m}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer"
                onClick={() => setSelected(slip)}
              >
                {/* top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <span className="text-[11px] font-bold leading-none">{MONTHS_SHORT[m - 1]}</span>
                        <span className="text-[10px] leading-none mt-0.5 opacity-60">{displayYear}</span>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Salary</p>
                        <p className="text-lg font-bold text-foreground font-mono">₹{Number(slip.net_salary).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted group-hover:bg-emerald-600 group-hover:text-white text-muted-foreground transition-colors">
                      <Eye size={13} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <TrendingUp size={11} className="text-emerald-500" />
                      <span>Gross ₹{Number(slip.gross_salary).toLocaleString()}</span>
                    </div>
                    {slip.lop_days > 0 ? (
                      <Badge className="text-[10px] bg-red-50 text-red-600 border border-red-200 px-2 py-0 h-5 font-medium">
                        <TrendingDown size={9} className="mr-1" />
                        LOP {slip.lop_days}d
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0 h-5 font-medium">
                        Full pay
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {monthsGrid.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Banknote size={28} className="opacity-30" />
              </div>
              <p className="text-sm font-medium">No payslips for {displayYear}</p>
              <p className="text-xs text-muted-foreground/60">Try selecting a different year</p>
            </div>
          )}
        </div>
      )}

      {/* ── Detail Dialog ───────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          {/* gradient header */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-6 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 -left-2 h-16 w-16 rounded-full bg-white/5" />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-100/70">
                {selected ? `${MONTHS[selected.month - 1]} ${selected.year}` : ''}
              </p>
              <p className="text-4xl font-bold text-white mt-1">
                {selected ? `₹${Number(selected.net_salary).toLocaleString()}` : ''}
              </p>
              <p className="text-xs text-emerald-100/60 mt-0.5">Net Salary</p>
            </div>
          </div>

          {selected && (
            <div className="p-5 space-y-3">
              {/* earnings block */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Earnings</p>
                {[
                  { label: 'Basic Salary', value: selected.basic },
                  { label: 'HRA',          value: selected.hra },
                  { label: 'Allowances',   value: selected.allowances },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-mono font-semibold">
                      {row.value != null ? `₹${Number(row.value).toLocaleString()}` : '—'}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span>Gross Salary</span>
                  <span className="font-mono text-emerald-700">₹{Number(selected.gross_salary).toLocaleString()}</span>
                </div>
              </div>

              {/* deductions block */}
              <div className="rounded-xl bg-red-50/70 p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Deductions</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">LOP ({selected.lop_days} days)</span>
                  <span className="font-mono font-semibold text-red-500">
                    {selected.lop_deduction > 0 ? `-₹${Number(selected.lop_deduction).toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>

              {/* net take-home */}
              <div className="flex items-center justify-between rounded-xl bg-emerald-600 px-4 py-3">
                <span className="text-sm font-semibold text-white">Take Home</span>
                <span className="text-xl font-bold text-white">₹{Number(selected.net_salary).toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
