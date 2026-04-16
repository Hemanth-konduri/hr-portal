'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { Announcement, AnnouncementPriority, AnnouncementCategory } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Megaphone, Pin, Search, CheckCheck, RefreshCw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

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

const PRIORITY_DOT: Record<AnnouncementPriority, string> = {
  low:    'bg-gray-400',
  normal: 'bg-blue-500',
  high:   'bg-amber-500',
  urgent: 'bg-red-500',
}

export default function EmployeeAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [catFilter,     setCatFilter]     = useState('all')
  const [priFilter,     setPriFilter]     = useState('all')

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/announcements')
      setAnnouncements(data)
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const markRead = async (a: Announcement) => {
    if (a.is_read_by_me) return
    try {
      await api.post(`/announcements/${a.id}/read`)
      setAnnouncements(prev =>
        prev.map(x => x.id === a.id ? { ...x, is_read_by_me: 1 } : x)
      )
    } catch {
      // silent — non-critical
    }
  }

  const markAllRead = async () => {
    const unread = announcements.filter(a => !a.is_read_by_me)
    await Promise.allSettled(unread.map(a => api.post(`/announcements/${a.id}/read`)))
    setAnnouncements(prev => prev.map(a => ({ ...a, is_read_by_me: 1 })))
    toast.success('All marked as read')
  }

  const filtered = announcements.filter(a => {
    if (catFilter !== 'all' && a.category !== catFilter) return false
    if (priFilter !== 'all' && a.priority !== priFilter) return false
    const q = search.toLowerCase()
    return !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
  })

  const unreadCount = announcements.filter(a => !a.is_read_by_me).length
  const pinned      = filtered.filter(a => a.pinned)
  const regular     = filtered.filter(a => !a.pinned)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Announcements</h1>
            {unreadCount > 0 && (
              <Badge className="text-[10px] bg-red-500 text-white border-0 px-1.5 py-0.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">Company notices and updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAnnouncements} className="gap-2 h-9">
            <RefreshCw size={13} /> Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2 h-9">
              <CheckCheck size={13} /> Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
            {(['general','hr','policy','event','it','finance','other'] as AnnouncementCategory[]).map(c => (
              <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priFilter} onValueChange={setPriFilter}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Priority</SelectItem>
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
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} notice{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <Megaphone size={36} className="opacity-20" />
          <p className="text-sm">No announcements right now</p>
          <p className="text-xs">Check back later for company updates</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Pinned section */}
          {pinned.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Pin size={11} className="text-amber-500" /> Pinned
              </p>
              {pinned.map(a => (
                <AnnouncementCard key={a.id} a={a} onRead={markRead} />
              ))}
            </div>
          )}

          {/* Regular section */}
          {regular.length > 0 && (
            <div className="space-y-2">
              {pinned.length > 0 && (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  All Notices
                </p>
              )}
              {regular.map(a => (
                <AnnouncementCard key={a.id} a={a} onRead={markRead} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({ a, onRead }: { a: Announcement; onRead: (a: Announcement) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isUnread = !a.is_read_by_me

  const handleExpand = () => {
    setExpanded(v => !v)
    if (isUnread) onRead(a)
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-sm',
        a.pinned && 'border-amber-200 bg-amber-50/20',
        isUnread && 'border-l-4',
        isUnread && a.priority === 'urgent' && 'border-l-red-500',
        isUnread && a.priority === 'high'   && 'border-l-amber-500',
        isUnread && a.priority === 'normal' && 'border-l-blue-500',
        isUnread && a.priority === 'low'    && 'border-l-gray-400',
        !isUnread && 'opacity-80',
      )}
      onClick={handleExpand}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {isUnread && (
              <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[a.priority])} />
            )}
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold text-foreground leading-snug', !isUnread && 'font-medium')}>
                {a.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {a.pinned && <Pin size={12} className="text-amber-500" />}
            {isUnread && (
              <Badge className="text-[9px] bg-blue-500 text-white border-0 px-1.5 py-0.5">New</Badge>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={cn('text-[10px] capitalize', PRIORITY_STYLE[a.priority])}>
            {a.priority}
          </Badge>
          <Badge variant="outline" className={cn('text-[10px] capitalize', CATEGORY_STYLE[a.category])}>
            {a.category}
          </Badge>
        </div>

        {/* Content */}
        <p className={cn('text-xs text-muted-foreground leading-relaxed', !expanded && 'line-clamp-2')}>
          {a.content}
        </p>
        {a.content.length > 120 && (
          <p className="text-[10px] text-blue-600 font-medium">{expanded ? 'Show less' : 'Read more'}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
          <span>By <span className="font-medium text-foreground">{a.author}</span></span>
          <span>{format(parseISO(a.created_at), 'd MMM yyyy')}</span>
          {a.expires_at && (
            <span>Expires {format(parseISO(a.expires_at), 'd MMM yyyy')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
