'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { LeaveRequest, LeaveBalance, LeaveStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  CalendarDays, CheckCircle2, XCircle, Clock,
  PlusCircle, Trash2, AlertTriangle, Info, Eye, RefreshCw,
} from 'lucide-react'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const STATUS_STYLE: Record<LeaveStatus, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

const STATUS_ICON: Record<LeaveStatus, React.ReactNode> = {
  pending:  <Clock size={11} />,
  approved: <CheckCircle2 size={11} />,
  rejected: <XCircle size={11} />,
}

// Count working days (Mon–Sat, skip Sundays)
function countWorkingDays(from: string, to: string): number {
  if (!from || !to) return 0
  try {
    const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) })
    return days.filter(d => d.getDay() !== 0).length // exclude Sundays
  } catch {
    return 0
  }
}

export default function EmployeeLeavesPage() {
  const [leaves,  setLeaves]  = useState<LeaveRequest[]>([])
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [loading, setLoading] = useState(true)

  // Apply form
  const [leaveType, setLeaveType] = useState<'casual' | 'lop'>('casual')
  const [fromDate,  setFromDate]  = useState('')
  const [toDate,    setToDate]    = useState('')
  const [reason,    setReason]    = useState('')
  const [applying,  setApplying]  = useState(false)

  // Cancel confirm
  const [cancelId, setCancelId] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // View detail
  const [viewLeave, setViewLeave] = useState<LeaveRequest | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes, bRes] = await Promise.all([
        api.get('/leaves/my'),
        api.get('/leaves/balance'),
      ])
      setLeaves(lRes.data)
      setBalance(bRes.data)
    } catch (err: any) {
      const msg = err.response?.data?.msg || err.message || 'Failed to load leave data'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const workingDays = countWorkingDays(fromDate, toDate)

  const handleApply = async () => {
    if (!fromDate || !toDate || !reason.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    if (parseISO(toDate) < parseISO(fromDate)) {
      toast.error('End date must be after start date')
      return
    }
    if (leaveType === 'casual' && workingDays > (balance?.casual_remaining ?? 0)) {
      toast.error(`Insufficient casual leave balance. You have ${balance?.casual_remaining ?? 0} day(s) remaining.`)
      return
    }
    setApplying(true)
    try {
      await api.post('/leaves/apply', { leave_type: leaveType, from_date: fromDate, to_date: toDate, reason: reason.trim() })
      toast.success('Leave application submitted successfully')
      setFromDate(''); setToDate(''); setReason(''); setLeaveType('casual')
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to apply for leave')
    } finally {
      setApplying(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    try {
      await api.delete(`/leaves/${cancelId}/cancel`)
      toast.success('Leave request cancelled')
      setCancelId(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to cancel leave')
    } finally {
      setCancelling(false)
    }
  }

  const pending  = leaves.filter(l => l.status === 'pending').length
  const approved = leaves.filter(l => l.status === 'approved').length
  const rejected = leaves.filter(l => l.status === 'rejected').length
  const today    = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Leaves</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Apply for leave and track your requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 h-9">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* Balance + Stats Row */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

          {/* Casual Leave Balance */}
          <Card className="border-2 border-indigo-100">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Casual Leave</p>
                    <p className="text-[10px] text-muted-foreground">Annual entitlement</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{balance?.casual_remaining ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">of {balance?.casual_total ?? 1} remaining</p>
                </div>
              </div>
              <Progress
                value={((balance?.casual_used ?? 0) / (balance?.casual_total ?? 1)) * 100}
                className="h-1.5"
              />
              <p className="text-[10px] text-muted-foreground">
                {balance?.casual_used ?? 0} used · {balance?.casual_remaining ?? 0} available
              </p>
            </CardContent>
          </Card>

          {/* LOP Info */}
          <Card className="border-2 border-orange-100">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Loss of Pay (LOP)</p>
                    <p className="text-[10px] text-muted-foreground">Unpaid leave taken</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{balance?.lop_count ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">days this year</p>
                </div>
              </div>
              <Separator />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                LOP days are deducted from your monthly salary. Each LOP day reduces your net pay proportionally.
              </p>
            </CardContent>
          </Card>

          {/* Request Summary */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Info size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Request Summary</p>
                  <p className="text-[10px] text-muted-foreground">{leaves.length} total requests</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Pending',  value: pending,  color: 'text-amber-600'   },
                  { label: 'Approved', value: approved, color: 'text-emerald-600' },
                  { label: 'Rejected', value: rejected, color: 'text-red-500'     },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Apply + History Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Apply Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <PlusCircle size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Apply for Leave</CardTitle>
                  <CardDescription className="text-xs">Submit a new leave request</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Leave Type */}
              <div className="space-y-1.5">
                <Label className="text-xs">Leave Type <span className="text-red-500">*</span></Label>
                <Select value={leaveType} onValueChange={v => setLeaveType(v as 'casual' | 'lop')}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual" className="text-sm">
                      Casual Leave {balance ? `(${balance.casual_remaining} remaining)` : ''}
                    </SelectItem>
                    <SelectItem value="lop" className="text-sm">Loss of Pay (LOP)</SelectItem>
                  </SelectContent>
                </Select>
                {leaveType === 'lop' && (
                  <p className="text-[10px] text-orange-600 flex items-center gap-1">
                    <AlertTriangle size={10} /> LOP will be deducted from your salary
                  </p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">From Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={fromDate} min={today}
                    onChange={e => { setFromDate(e.target.value); if (!toDate || e.target.value > toDate) setToDate(e.target.value) }}
                    className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={toDate} min={fromDate || today}
                    onChange={e => setToDate(e.target.value)}
                    className="h-9 text-sm" />
                </div>
              </div>

              {/* Working days preview */}
              {fromDate && toDate && workingDays > 0 && (
                <div className={cn(
                  'rounded-lg px-3 py-2 text-xs flex items-center justify-between',
                  leaveType === 'casual' && workingDays > (balance?.casual_remaining ?? 0)
                    ? 'bg-red-50 text-red-600'
                    : 'bg-blue-50 text-blue-700'
                )}>
                  <span>{workingDays} working day{workingDays !== 1 ? 's' : ''} selected</span>
                  {leaveType === 'casual' && workingDays > (balance?.casual_remaining ?? 0) && (
                    <span className="font-semibold">Exceeds balance!</span>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="space-y-1.5">
                <Label className="text-xs">Reason <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="Briefly describe the reason for your leave..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
                <p className="text-[10px] text-muted-foreground text-right">{reason.length}/500</p>
              </div>

              <Button
                onClick={handleApply}
                disabled={applying || !fromDate || !toDate || !reason.trim()}
                className="w-full gap-2"
              >
                <PlusCircle size={14} />
                {applying ? 'Submitting...' : 'Submit Leave Request'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Leave History */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Leave History</CardTitle>
              <CardDescription className="text-xs">{leaves.length} total requests</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : leaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <CalendarDays size={32} className="text-muted-foreground/30" />
                  <p className="text-sm">No leave requests yet</p>
                  <p className="text-xs">Apply for leave using the form</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">From</TableHead>
                        <TableHead className="text-xs">To</TableHead>
                        <TableHead className="text-xs">Days</TableHead>
                        <TableHead className="text-xs">Reason</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Remark</TableHead>
                        <TableHead className="text-xs w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map(l => (
                        <TableRow key={l.id} className="text-sm align-top">
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] capitalize',
                              l.leave_type === 'casual'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-orange-50 text-orange-700 border-orange-200'
                            )}>
                              {l.leave_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(parseISO(l.from_date), 'd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(parseISO(l.to_date), 'd MMM yyyy')}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-foreground">{l.total_days}d</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[120px]">
                            <p className="line-clamp-2">{l.reason}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px] capitalize flex items-center gap-1 w-fit', STATUS_STYLE[l.status])}>
                              {STATUS_ICON[l.status]}
                              {l.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[120px]">
                            {l.review_remark ? (
                              <p className="line-clamp-2 italic">"{l.review_remark}"</p>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost" size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                                onClick={() => setViewLeave(l)}
                              >
                                <Eye size={13} />
                              </Button>
                              {l.status === 'pending' && (
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                  onClick={() => setCancelId(l.id)}
                                >
                                  <Trash2 size={13} />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leave Detail Dialog */}
      <Dialog open={!!viewLeave} onOpenChange={v => !v && setViewLeave(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Leave Request Details</DialogTitle>
          </DialogHeader>
          {viewLeave && (
            <div className="space-y-4">
              {/* Status banner */}
              <div className={cn(
                'rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-semibold',
                viewLeave.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                viewLeave.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                                  'bg-amber-50 text-amber-700'
              )}>
                {viewLeave.status === 'approved' ? <CheckCircle2 size={16} /> :
                 viewLeave.status === 'rejected' ? <XCircle size={16} /> :
                                                   <Clock size={16} />}
                {viewLeave.status.charAt(0).toUpperCase() + viewLeave.status.slice(1)}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Leave Type', value: viewLeave.leave_type.toUpperCase() },
                  { label: 'Duration',   value: `${viewLeave.total_days} day${viewLeave.total_days !== 1 ? 's' : ''}` },
                  { label: 'From',       value: format(parseISO(viewLeave.from_date), 'd MMM yyyy') },
                  { label: 'To',         value: format(parseISO(viewLeave.to_date), 'd MMM yyyy') },
                  { label: 'Applied On', value: format(parseISO(viewLeave.created_at), 'd MMM yyyy') },
                  { label: 'Reviewed',   value: viewLeave.reviewed_at ? format(parseISO(viewLeave.reviewed_at), 'd MMM yyyy') : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-muted/50 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Reason */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reason for Leave</p>
                <p className="text-sm text-foreground leading-relaxed">{viewLeave.reason}</p>
              </div>

              {/* HR Remark */}
              {viewLeave.review_remark && (
                <div className={cn(
                  'rounded-lg p-3 space-y-1',
                  viewLeave.status === 'rejected' ? 'bg-red-50' : 'bg-emerald-50'
                )}>
                  <p className={cn(
                    'text-[10px] uppercase tracking-wider font-semibold',
                    viewLeave.status === 'rejected' ? 'text-red-500' : 'text-emerald-600'
                  )}>
                    {viewLeave.status === 'rejected' ? 'Reason for Rejection' : 'HR Remark'}
                  </p>
                  <p className={cn(
                    'text-sm leading-relaxed italic',
                    viewLeave.status === 'rejected' ? 'text-red-700' : 'text-emerald-700'
                  )}>
                    "{viewLeave.review_remark}"
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirm Dialog */}
      <AlertDialog open={!!cancelId} onOpenChange={v => !v && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Leave Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your pending leave request. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
