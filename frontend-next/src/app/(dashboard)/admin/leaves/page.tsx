'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { LeaveRequest, LeaveStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatCard } from '@/components/dashboard/StatCard'
import { toast } from 'sonner'
import {
  CalendarDays, CheckCircle2, XCircle, Clock, Search,
  RefreshCw, Filter, ChevronDown, ChevronUp, ChevronsUpDown, Eye,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<LeaveStatus, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

const TYPE_STYLE: Record<string, string> = {
  casual: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  lop:    'bg-orange-50 text-orange-700 border-orange-200',
}

interface LeaveStats {
  total: number
  pending: number
  approved: number
  rejected: number
  casual_count: number
  lop_count: number
  total_days: number
}

type SortField = 'full_name' | 'from_date' | 'total_days' | 'created_at'
type SortDir = 'asc' | 'desc'

function SortTh({
  field, label, sortField, sortDir, onSort,
}: {
  field: SortField; label: string; sortField: SortField; sortDir: SortDir; onSort: (f: SortField) => void
}) {
  const Icon = sortField !== field ? ChevronsUpDown : sortDir === 'asc' ? ChevronUp : ChevronDown
  return (
    <TableHead className="cursor-pointer select-none text-xs whitespace-nowrap" onClick={() => onSort(field)}>
      <span className="flex items-center gap-1">{label}<Icon size={11} className="text-muted-foreground/60" /></span>
    </TableHead>
  )
}

export default function AdminLeavesPage() {
  const [leaves,    setLeaves]    = useState<LeaveRequest[]>([])
  const [stats,     setStats]     = useState<LeaveStats | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir,   setSortDir]   = useState<SortDir>('desc')

  // Review dialog state
  const [reviewLeave,  setReviewLeave]  = useState<LeaveRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved')
  const [remark,       setRemark]       = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  // View detail dialog
  const [viewLeave, setViewLeave] = useState<LeaveRequest | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes, sRes] = await Promise.all([
        api.get('/leaves/all'),
        api.get('/leaves/stats'),
      ])
      setLeaves(lRes.data)
      setStats(sRes.data)
    } catch (err: any) {
      const msg = err.response?.data?.msg || err.message || 'Failed to load leave data'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const openReview = (leave: LeaveRequest, action: 'approved' | 'rejected') => {
    setReviewLeave(leave)
    setReviewAction(action)
    setRemark('')
  }

  const submitReview = async () => {
    if (!reviewLeave) return
    if (reviewAction === 'rejected' && !remark.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    setSubmitting(true)
    try {
      await api.put(`/leaves/${reviewLeave.id}/status`, {
        status: reviewAction,
        review_remark: remark.trim() || undefined,
      })
      toast.success(`Leave ${reviewAction} successfully`)
      setReviewLeave(null)
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = leaves
    .filter(l => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (typeFilter !== 'all' && l.leave_type !== typeFilter) return false
      const q = search.toLowerCase()
      return !q || l.full_name?.toLowerCase().includes(q) || l.employee_id?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const va = String(a[sortField as keyof LeaveRequest] ?? '')
      const vb = String(b[sortField as keyof LeaveRequest] ?? '')
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const pending  = leaves.filter(l => l.status === 'pending')
  const approved = leaves.filter(l => l.status === 'approved')
  const rejected = leaves.filter(l => l.status === 'rejected')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Leave Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review and manage employee leave requests</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 h-9">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Requests" value={stats?.total ?? 0}    icon={CalendarDays} iconClass="bg-blue-50 text-blue-600"
            sub={`${stats?.total_days ?? 0} total days requested`} />
          <StatCard title="Pending"        value={stats?.pending ?? 0}  icon={Clock}        iconClass="bg-amber-50 text-amber-600"
            sub="Awaiting review" trend={stats?.pending ? `${stats.pending} need action` : 'All clear'} trendUp={!stats?.pending} />
          <StatCard title="Approved"       value={stats?.approved ?? 0} icon={CheckCircle2} iconClass="bg-emerald-50 text-emerald-600"
            sub={`${stats?.casual_count ?? 0} casual · ${stats?.lop_count ?? 0} LOP`} />
          <StatCard title="Rejected"       value={stats?.rejected ?? 0} icon={XCircle}      iconClass="bg-red-50 text-red-500"
            sub="Declined requests" />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="all"      className="text-xs">All ({leaves.length})</TabsTrigger>
            <TabsTrigger value="pending"  className="text-xs">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter size={12} /> Filters
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all"    className="text-xs">All Types</SelectItem>
                <SelectItem value="casual" className="text-xs">Casual</SelectItem>
                <SelectItem value="lop"    className="text-xs">LOP</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search name / ID..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-7 h-8 w-48 text-xs" />
            </div>
          </div>
        </div>

        {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => {
          const tabLeaves = tab === 'all' ? filtered : filtered.filter(l => l.status === tab)
          return (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold capitalize">{tab === 'all' ? 'All Leave Requests' : `${tab} Requests`}</CardTitle>
                  <CardDescription className="text-xs">{tabLeaves.length} records</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <SortTh field="full_name"   label="Employee"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                            <TableHead className="text-xs">Type</TableHead>
                            <SortTh field="from_date"   label="From"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                            <TableHead className="text-xs">To</TableHead>
                            <SortTh field="total_days"  label="Days"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                            <TableHead className="text-xs">Reason</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Remark</TableHead>
                            <SortTh field="created_at"  label="Applied"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                            <TableHead className="text-xs w-28">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tabLeaves.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={10} className="py-16 text-center text-sm text-muted-foreground">
                                No {tab === 'all' ? '' : tab} leave requests found.
                              </TableCell>
                            </TableRow>
                          ) : tabLeaves.map(l => (
                            <TableRow key={l.id} className="text-sm align-top">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarFallback className="text-[10px] font-bold bg-violet-100 text-violet-800">
                                      {l.full_name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-semibold text-foreground whitespace-nowrap">{l.full_name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">{l.employee_id}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn('text-[10px] capitalize', TYPE_STYLE[l.leave_type])}>
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
                              <TableCell className="text-xs text-muted-foreground max-w-[160px]">
                                <p className="line-clamp-2">{l.reason}</p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn('text-[10px] capitalize', STATUS_STYLE[l.status])}>
                                  <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full inline-block',
                                    l.status === 'approved' ? 'bg-emerald-500' :
                                    l.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                                  )} />
                                  {l.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[140px]">
                                {l.review_remark ? (
                                  <p className="line-clamp-2 italic">"{l.review_remark}"</p>
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(parseISO(l.created_at), 'd MMM yyyy')}
                              </TableCell>
                              <TableCell>
                                {l.status === 'pending' ? (
                                  <div className="flex items-center gap-1.5">
                                    <Button size="sm" onClick={() => openReview(l, 'approved')}
                                      className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                                      <CheckCircle2 size={11} /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => openReview(l, 'rejected')}
                                      className="h-7 px-2.5 text-[11px] border-red-200 text-red-600 hover:bg-red-50 gap-1">
                                      <XCircle size={11} /> Reject
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setViewLeave(l)}
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600">
                                      <Eye size={13} />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-muted-foreground">
                                      {l.reviewed_at ? format(parseISO(l.reviewed_at), 'd MMM') : '—'}
                                    </span>
                                    <Button size="sm" variant="ghost" onClick={() => setViewLeave(l)}
                                      className="h-7 w-7 p-0 text-muted-foreground hover:text-blue-600">
                                      <Eye size={13} />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {!loading && tabLeaves.length > 0 && (
                    <p className="text-[11px] text-muted-foreground text-right px-4 py-2">
                      {tabLeaves.length} record{tabLeaves.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Leave Detail Dialog */}
      <Dialog open={!!viewLeave} onOpenChange={v => !v && setViewLeave(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Leave Request Details</DialogTitle>
          </DialogHeader>
          {viewLeave && (
            <div className="space-y-4">
              {/* Employee + Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm font-bold bg-violet-100 text-violet-800">
                      {viewLeave.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{viewLeave.full_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{viewLeave.employee_id}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('text-xs capitalize', STATUS_STYLE[viewLeave.status])}>
                  <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full inline-block',
                    viewLeave.status === 'approved' ? 'bg-emerald-500' :
                    viewLeave.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                  )} />
                  {viewLeave.status}
                </Badge>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
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

              {/* Quick action for pending */}
              {viewLeave.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => { setViewLeave(null); openReview(viewLeave, 'approved') }}>
                    <CheckCircle2 size={13} /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-1"
                    onClick={() => { setViewLeave(null); openReview(viewLeave, 'rejected') }}>
                    <XCircle size={13} /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={!!reviewLeave} onOpenChange={v => !v && setReviewLeave(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {reviewAction === 'approved' ? '✅ Approve Leave Request' : '❌ Reject Leave Request'}
            </DialogTitle>
          </DialogHeader>

          {reviewLeave && (
            <div className="space-y-4">
              {/* Leave summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-bold bg-violet-100 text-violet-800">
                      {reviewLeave.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">{reviewLeave.full_name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{reviewLeave.employee_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{reviewLeave.leave_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{reviewLeave.total_days} day{reviewLeave.total_days !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">From</p>
                    <p className="font-medium">{format(parseISO(reviewLeave.from_date), 'd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">To</p>
                    <p className="font-medium">{format(parseISO(reviewLeave.to_date), 'd MMM yyyy')}</p>
                  </div>
                </div>
                <div className="text-xs pt-1">
                  <p className="text-muted-foreground">Reason</p>
                  <p className="font-medium">{reviewLeave.reason}</p>
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Remark {reviewAction === 'rejected' && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  placeholder={reviewAction === 'approved'
                    ? 'Optional note for the employee...'
                    : 'Reason for rejection (required)...'}
                  value={remark}
                  onChange={e => setRemark(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setReviewLeave(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submitReview}
              disabled={submitting}
              className={reviewAction === 'approved'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {submitting ? 'Submitting...' : reviewAction === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
