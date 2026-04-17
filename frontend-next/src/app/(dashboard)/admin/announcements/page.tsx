'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { Announcement, AnnouncementPriority, AnnouncementCategory, AnnouncementAudience } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatCard } from '@/components/dashboard/StatCard'
import { toast } from 'sonner'
import {
  Megaphone, Pin, PinOff, Pencil, Trash2, RefreshCw,
  PlusCircle, Eye, EyeOff, Search, Users, AlertTriangle,
} from 'lucide-react'
import { format, parseISO, isPast } from 'date-fns'
import { cn } from '@/lib/utils'

// ── Style maps ────────────────────────────────────────────────────────────
const PRIORITY_STYLE: Record<AnnouncementPriority, string> = {
  low:    'bg-gray-100 text-gray-500 border-gray-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  high:   'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-red-50 text-red-600 border-red-200',
}

const CATEGORY_STYLE: Record<AnnouncementCategory, string> = {
  general: 'bg-slate-100 text-slate-600 border-slate-200',
  hr:      'bg-violet-50 text-violet-700 border-violet-200',
  policy:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  event:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  it:      'bg-cyan-50 text-cyan-700 border-cyan-200',
  finance: 'bg-green-50 text-green-700 border-green-200',
  other:   'bg-gray-100 text-gray-500 border-gray-200',
}

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  all:       'Everyone',
  employees: 'Employees only',
  admins:    'Admins only',
}

interface Stats {
  total: number
  active: number
  pinned: number
  urgent: number
  expired: number
}

const EMPTY_FORM = {
  title: '', content: '',
  priority: 'normal' as AnnouncementPriority,
  category: 'general' as AnnouncementCategory,
  target_audience: 'all' as AnnouncementAudience,
  pinned: false,
  expires_at: '',
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [stats,         setStats]         = useState<Stats | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [catFilter,     setCatFilter]     = useState('all')
  const [priFilter,     setPriFilter]     = useState('all')
  const [tab,           setTab]           = useState('active')

  // Form dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing,    setEditing]    = useState<Announcement | null>(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [annRes, statsRes] = await Promise.all([
        api.get('/announcements/all'),
        api.get('/announcements/stats'),
      ])
      setAnnouncements(annRes.data)
      setStats(statsRes.data)
    } catch {
      toast.error('Failed to load announcements')
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

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({
      title:           a.title,
      content:         a.content,
      priority:        a.priority,
      category:        a.category,
      target_audience: a.target_audience,
      pinned:          a.pinned,
      expires_at:      a.expires_at ? a.expires_at.split('T')[0] : '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        expires_at: form.expires_at || null,
      }
      if (editing) {
        await api.put(`/announcements/${editing.id}`, payload)
        toast.success('Announcement updated')
      } else {
        await api.post('/announcements', payload)
        toast.success('Announcement created')
      }
      setDialogOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const togglePin = async (a: Announcement) => {
    try {
      await api.patch(`/announcements/${a.id}/toggle-pin`)
      toast.success(a.pinned ? 'Unpinned' : 'Pinned')
      fetchAll()
    } catch { toast.error('Failed') }
  }

  const toggleActive = async (a: Announcement) => {
    try {
      await api.patch(`/announcements/${a.id}/toggle-active`)
      toast.success(a.is_active ? 'Archived' : 'Restored')
      fetchAll()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/announcements/${id}`)
      toast.success('Deleted')
      fetchAll()
    } catch { toast.error('Failed to delete') }
  }

  const filtered = announcements
    .filter(a => {
      if (tab === 'active'   && !a.is_active) return false
      if (tab === 'archived' &&  a.is_active) return false
      if (tab === 'pinned'   && !a.pinned)    return false
      if (tab === 'urgent'   && a.priority !== 'urgent') return false
      if (catFilter !== 'all' && a.category !== catFilter) return false
      if (priFilter !== 'all' && a.priority !== priFilter) return false
      const q = search.toLowerCase()
      return !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    })

  const isExpired = (a: Announcement) => !!a.expires_at && isPast(parseISO(a.expires_at))

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Announcements</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Create and manage company-wide notices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 h-9">
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-2 h-9">
            <PlusCircle size={13} /> New Announcement
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
          <StatCard title="Total"    value={stats?.total   ?? 0} icon={Megaphone}     iconClass="bg-blue-50 text-blue-600"
            sub={`${stats?.active ?? 0} active`} />
          <StatCard title="Pinned"   value={stats?.pinned  ?? 0} icon={Pin}           iconClass="bg-amber-50 text-amber-600"
            sub="Sticky notices" />
          <StatCard title="Urgent"   value={stats?.urgent  ?? 0} icon={AlertTriangle} iconClass="bg-red-50 text-red-500"
            sub="High priority" />
          <StatCard title="Expired"  value={stats?.expired ?? 0} icon={EyeOff}        iconClass="bg-gray-100 text-gray-500"
            sub="Past expiry date" />
        </div>
      )}

      {/* Tabs + Filters */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="active"   className="text-xs">Active ({announcements.filter(a => a.is_active).length})</TabsTrigger>
            <TabsTrigger value="pinned"   className="text-xs">Pinned ({announcements.filter(a => a.pinned).length})</TabsTrigger>
            <TabsTrigger value="urgent"   className="text-xs">Urgent ({announcements.filter(a => a.priority === 'urgent').length})</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs">Archived ({announcements.filter(a => !a.is_active).length})</TabsTrigger>
            <TabsTrigger value="all"      className="text-xs">All ({announcements.length})</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all"     className="text-xs">All Categories</SelectItem>
                {(['general','hr','policy','event','it','finance','other'] as AnnouncementCategory[]).map(c => (
                  <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priFilter} onValueChange={setPriFilter}>
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all"    className="text-xs">All Priority</SelectItem>
                {(['low','normal','high','urgent'] as AnnouncementPriority[]).map(p => (
                  <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-7 h-8 w-44 text-xs" />
            </div>
          </div>
        </div>

        {(['active','pinned','urgent','archived','all'] as const).map(t => (
          <TabsContent key={t} value={t}>
            {loading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                <Megaphone size={32} className="opacity-20" />
                <p className="text-sm">No announcements found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(a => (
                  <Card key={a.id} className={cn(
                    'transition-all',
                    a.pinned && 'border-amber-200 bg-amber-50/30',
                    !a.is_active && 'opacity-60',
                    isExpired(a) && 'border-dashed',
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">

                          {/* Title row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {a.pinned && <Pin size={13} className="text-amber-500 shrink-0" />}
                            <p className="text-sm font-semibold text-foreground">{a.title}</p>
                            {isExpired(a) && (
                              <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-500 border-gray-200">Expired</Badge>
                            )}
                            {!a.is_active && (
                              <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-500">Archived</Badge>
                            )}
                          </div>

                          {/* Badges row */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className={cn('text-[10px] capitalize', PRIORITY_STYLE[a.priority])}>
                              {a.priority}
                            </Badge>
                            <Badge variant="outline" className={cn('text-[10px] capitalize', CATEGORY_STYLE[a.category])}>
                              {a.category}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 gap-1">
                              <Users size={9} /> {AUDIENCE_LABEL[a.target_audience]}
                            </Badge>
                          </div>

                          {/* Content */}
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{a.content}</p>

                          {/* Meta */}
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                            <span>By <span className="font-medium text-foreground">{a.author}</span></span>
                            <span>{format(parseISO(a.created_at), 'd MMM yyyy, HH:mm')}</span>
                            {a.expires_at && (
                              <span className={cn(isExpired(a) ? 'text-red-500' : 'text-muted-foreground')}>
                                Expires {format(parseISO(a.expires_at), 'd MMM yyyy')}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye size={10} /> {a.read_count ?? 0} read{(a.read_count ?? 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                            title={a.pinned ? 'Unpin' : 'Pin'}
                            onClick={() => togglePin(a)}>
                            {a.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500"
                            title={a.is_active ? 'Archive' : 'Restore'}
                            onClick={() => toggleActive(a)}>
                            {a.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(a)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(a.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editing ? 'Edit Announcement' : 'New Announcement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title <span className="text-red-500">*</span></Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Announcement title..." className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Content <span className="text-red-500">*</span></Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write the announcement details..." rows={4} className="text-sm resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as AnnouncementPriority }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['low','normal','high','urgent'] as AnnouncementPriority[]).map(p => (
                      <SelectItem key={p} value={p} className="text-sm capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as AnnouncementCategory }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['general','hr','policy','event','it','finance','other'] as AnnouncementCategory[]).map(c => (
                      <SelectItem key={c} value={c} className="text-sm capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Audience</Label>
                <Select value={form.target_audience} onValueChange={v => setForm(f => ({ ...f, target_audience: v as AnnouncementAudience }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all"       className="text-sm">Everyone</SelectItem>
                    <SelectItem value="employees" className="text-sm">Employees only</SelectItem>
                    <SelectItem value="admins"    className="text-sm">Admins only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expires On (optional)</Label>
                <Input type="date" value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="h-9 text-sm" />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
              <Switch checked={form.pinned} onCheckedChange={v => setForm(f => ({ ...f, pinned: v }))} />
              <div>
                <p className="text-xs font-medium">Pin this announcement</p>
                <p className="text-[10px] text-muted-foreground">Pinned notices appear at the top of the feed</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
