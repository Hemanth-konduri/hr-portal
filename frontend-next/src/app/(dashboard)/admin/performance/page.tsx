'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { PerformanceReview, User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartConfig, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  LineChart, Line,
} from 'recharts'
import { toast } from 'sonner'
import {
  Award, Star, Users, TrendingUp, PlusCircle,
  Pencil, Trash2, Search, RefreshCw, Filter,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────
const RATING_LABEL: Record<number, string> = {
  1: 'Poor', 2: 'Needs Improvement', 3: 'Average', 4: 'Good', 5: 'Excellent',
}
const RATING_COLOR: Record<number, string> = {
  1: 'bg-red-50 text-red-600 border-red-200',
  2: 'bg-orange-50 text-orange-600 border-orange-200',
  3: 'bg-amber-50 text-amber-700 border-amber-200',
  4: 'bg-blue-50 text-blue-700 border-blue-200',
  5: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}
const RATING_BAR_COLOR: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#3b82f6', 5: '#10b981',
}

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} size={size}
          className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/25'} />
      ))}
    </div>
  )
}

interface EmployeeStat {
  id: number
  full_name: string
  employee_id: string
  department: string
  total_reviews: number
  avg_rating: number | null
  highest: number | null
  lowest: number | null
  last_reviewed: string | null
}

const teamAvgConfig: ChartConfig = {
  avg_rating: { label: 'Avg Rating', color: '#f59e0b' },
}
const distConfig: ChartConfig = {
  count: { label: 'Reviews', color: '#6366f1' },
}

const EMPTY_FORM = { user_id: '', period: '', rating: '5', feedback: '' }

export default function AdminPerformancePage() {
  const [reviews,   setReviews]   = useState<PerformanceReview[]>([])
  const [empStats,  setEmpStats]  = useState<EmployeeStat[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [empFilter, setEmpFilter] = useState('all')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing,    setEditing]    = useState<PerformanceReview | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [revRes, statRes, empRes] = await Promise.all([
        api.get('/performance/all'),
        api.get('/performance/stats'),
        api.get('/users'),
      ])
      setReviews(revRes.data)
      setEmpStats(statRes.data)
      setEmployees(empRes.data.filter((u: User) => u.role === 'employee'))
    } catch {
      toast.error('Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (r: PerformanceReview) => {
    setEditing(r)
    setForm({
      user_id:  String(r.user_id),
      period:   r.period,
      rating:   String(r.rating),
      feedback: r.feedback ?? '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.user_id || !form.period.trim() || !form.rating) {
      toast.error('Employee, period and rating are required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/performance/${editing.id}`, {
          rating:   Number(form.rating),
          feedback: form.feedback,
          period:   form.period,
        })
        toast.success('Review updated')
      } else {
        await api.post('/performance', {
          user_id:  Number(form.user_id),
          period:   form.period.trim(),
          rating:   Number(form.rating),
          feedback: form.feedback.trim() || undefined,
        })
        toast.success('Review submitted')
      }
      setDialogOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to save review')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/performance/${id}`)
      toast.success('Review deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete')
    }
  }

  // ── Derived ───────────────────────────────────────────────
  const totalReviews  = reviews.length
  const avgTeamRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'
  const excellentCount = reviews.filter(r => r.rating === 5).length
  const reviewedCount  = empStats.filter(e => (e.total_reviews ?? 0) > 0).length

  const filteredReviews = reviews.filter(r => {
    if (empFilter !== 'all' && String(r.user_id) !== empFilter) return false
    const q = search.toLowerCase()
    return !q || r.full_name?.toLowerCase().includes(q) || r.period?.toLowerCase().includes(q)
  })

  // Team avg per employee (top 8)
  const teamChartData = empStats
    .filter(e => e.avg_rating != null)
    .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
    .slice(0, 8)
    .map(e => ({ name: e.full_name.split(' ')[0], avg_rating: Number(e.avg_rating) }))

  // Distribution across all reviews
  const distData = [5, 4, 3, 2, 1].map(r => ({
    label: String(r),
    count: reviews.filter(x => x.rating === r).length,
    fill:  RATING_BAR_COLOR[r],
  }))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Performance Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Review and track employee performance ratings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 h-9">
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-2 h-9">
            <PlusCircle size={13} /> Add Review
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Reviews"   value={totalReviews}
            icon={Star}       iconClass="bg-amber-50 text-amber-600"
            sub={`${reviewedCount} employees reviewed`} />
          <StatCard title="Team Avg Rating" value={avgTeamRating}
            icon={TrendingUp} iconClass="bg-blue-50 text-blue-600"
            sub="Across all reviews"
            trend={Number(avgTeamRating) >= 3.5 ? 'Above average' : 'Needs attention'}
            trendUp={Number(avgTeamRating) >= 3.5} />
          <StatCard title="Excellent (5★)"  value={excellentCount}
            icon={Award}      iconClass="bg-emerald-50 text-emerald-600"
            sub={`${Math.round((excellentCount / (totalReviews || 1)) * 100)}% of all reviews`} />
          <StatCard title="Employees"        value={employees.length}
            icon={Users}      iconClass="bg-violet-50 text-violet-600"
            sub={`${employees.length - reviewedCount} not yet reviewed`} />
        </div>
      )}

      {/* Charts */}
      {!loading && reviews.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Team avg bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Team Average Ratings</CardTitle>
              <CardDescription className="text-xs">Top 8 employees by average rating</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={teamAvgConfig} className="h-[200px] w-full">
                <BarChart data={teamChartData} barSize={20} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="avg_rating" fill="var(--color-avg_rating)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Rating distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Rating Distribution</CardTitle>
              <CardDescription className="text-xs">How many reviews at each star level</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={distConfig} className="h-[200px] w-full">
                <BarChart data={distData} barSize={36} margin={{ left: 4, right: 8 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}★`} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="reviews">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="reviews"  className="text-xs">All Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="employees" className="text-xs">By Employee ({empStats.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Select value={empFilter} onValueChange={setEmpFilter}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Filter by employee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Employees</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={String(e.id)} className="text-xs">{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-7 h-8 w-40 text-xs" />
            </div>
          </div>
        </div>

        {/* All Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Performance Reviews</CardTitle>
              <CardDescription className="text-xs">{filteredReviews.length} records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : filteredReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                  <Award size={32} className="opacity-20" />
                  <p className="text-sm">No reviews found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs">Employee</TableHead>
                        <TableHead className="text-xs">Period</TableHead>
                        <TableHead className="text-xs">Rating</TableHead>
                        <TableHead className="text-xs">Stars</TableHead>
                        <TableHead className="text-xs">Feedback</TableHead>
                        <TableHead className="text-xs">Reviewed By</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReviews.map(r => (
                        <TableRow key={r.id} className="text-sm align-top">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-[10px] font-bold bg-violet-100 text-violet-800">
                                  {r.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-semibold text-foreground whitespace-nowrap">{r.full_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{r.employee_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-medium text-foreground whitespace-nowrap">{r.period}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px]', RATING_COLOR[r.rating])}>
                              {r.rating}/5 · {RATING_LABEL[r.rating]}
                            </Badge>
                          </TableCell>
                          <TableCell><StarRating rating={r.rating} /></TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[180px]">
                            {r.feedback
                              ? <p className="line-clamp-2 italic">"{r.feedback}"</p>
                              : <span className="text-muted-foreground/50">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {r.reviewer_name ?? 'Admin'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(parseISO(r.created_at), 'd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => openEdit(r)}>
                                <Pencil size={13} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                onClick={() => handleDelete(r.id)}>
                                <Trash2 size={13} />
                              </Button>
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
        </TabsContent>

        {/* By Employee Tab */}
        <TabsContent value="employees">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Employee Performance Summary</CardTitle>
              <CardDescription className="text-xs">Aggregated ratings per employee</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs">Employee</TableHead>
                        <TableHead className="text-xs">Department</TableHead>
                        <TableHead className="text-xs text-center">Reviews</TableHead>
                        <TableHead className="text-xs text-center">Avg Rating</TableHead>
                        <TableHead className="text-xs text-center">Highest</TableHead>
                        <TableHead className="text-xs text-center">Lowest</TableHead>
                        <TableHead className="text-xs">Last Reviewed</TableHead>
                        <TableHead className="text-xs w-24">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empStats.map(e => (
                        <TableRow key={e.id} className="text-sm">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-[10px] font-bold bg-violet-100 text-violet-800">
                                  {e.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-semibold text-foreground whitespace-nowrap">{e.full_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{e.employee_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{e.department || '—'}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs font-semibold text-foreground">{e.total_reviews}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {e.avg_rating != null ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-sm font-bold" style={{ color: RATING_BAR_COLOR[Math.round(e.avg_rating)] }}>
                                  {Number(e.avg_rating).toFixed(1)}
                                </span>
                                <StarRating rating={Math.round(e.avg_rating)} size={11} />
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-500">Not reviewed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {e.highest != null
                              ? <span className="text-xs font-semibold text-emerald-600">{e.highest}★</span>
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {e.lowest != null
                              ? <span className="text-xs font-semibold text-red-500">{e.lowest}★</span>
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {e.last_reviewed ? format(parseISO(e.last_reviewed), 'd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] gap-1"
                              onClick={() => {
                                setForm({ ...EMPTY_FORM, user_id: String(e.id) })
                                setEditing(null)
                                setDialogOpen(true)
                              }}>
                              <PlusCircle size={11} /> Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editing ? 'Edit Performance Review' : 'Add Performance Review'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Employee */}
            <div className="space-y-1.5">
              <Label className="text-xs">Employee <span className="text-red-500">*</span></Label>
              <Select value={form.user_id} onValueChange={v => setForm(f => ({ ...f, user_id: v }))}
                disabled={!!editing}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={String(e.id)} className="text-sm">
                      {e.full_name}
                      <span className="text-muted-foreground font-mono text-xs ml-1">({e.employee_id})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period */}
            <div className="space-y-1.5">
              <Label className="text-xs">Review Period <span className="text-red-500">*</span></Label>
              <Input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                placeholder="e.g. Q1 2025, Jan 2025, 2025-H1" className="h-9 text-sm" />
            </div>

            {/* Rating */}
            <div className="space-y-1.5">
              <Label className="text-xs">Rating <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, rating: String(r) }))}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition-all',
                      String(r) === form.rating
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-border hover:border-amber-200 hover:bg-amber-50/50 text-muted-foreground'
                    )}
                  >
                    <Star size={16} className={String(r) === form.rating ? 'text-amber-400 fill-amber-400' : ''} />
                    <span>{r}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {RATING_LABEL[Number(form.rating)]}
              </p>
            </div>

            {/* Feedback */}
            <div className="space-y-1.5">
              <Label className="text-xs">Feedback (optional)</Label>
              <Textarea value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))}
                placeholder="Provide constructive feedback for the employee..."
                rows={3} className="text-sm resize-none" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
