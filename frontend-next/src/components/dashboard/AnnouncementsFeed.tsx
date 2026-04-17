'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Announcement } from '@/types'
import { ArrowRight, Megaphone, Pin } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const PRIORITY_DOT: Record<string, string> = {
  low:    'bg-gray-400',
  normal: 'bg-blue-500',
  high:   'bg-amber-500',
  urgent: 'bg-red-500',
}

interface Props {
  announcements: Announcement[]
  limit?: number
  showLink?: boolean
  linkHref?: string
}

export function AnnouncementsFeed({ announcements, limit = 4, showLink = true, linkHref = '/admin/announcements' }: Props) {
  const items = announcements
    .filter(a => a.is_active && !a.deleted_at)
    .slice(0, limit)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Announcements</CardTitle>
            <CardDescription className="text-xs">{items.length} active notices</CardDescription>
          </div>
          {showLink && (
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1">
              <Link href={linkHref}>Manage <ArrowRight size={12} /></Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <Megaphone size={24} className="opacity-30" />
            <p className="text-xs">No active announcements</p>
          </div>
        ) : items.map(a => (
          <div key={a.id} className={cn(
            'rounded-lg border border-border p-3 space-y-1 hover:bg-muted/40 transition-colors',
            a.pinned && 'border-amber-200 bg-amber-50/30',
          )}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {a.pinned && <Pin size={11} className="text-amber-500 shrink-0" />}
                <p className="text-xs font-semibold text-foreground leading-snug truncate">{a.title}</p>
              </div>
              <span className={cn('h-1.5 w-1.5 rounded-full mt-1 shrink-0', PRIORITY_DOT[a.priority ?? 'normal'])} />
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{a.content}</p>
            <div className="flex items-center gap-2">
              {a.category && (
                <Badge variant="outline" className="text-[9px] capitalize px-1.5 py-0">{a.category}</Badge>
              )}
              <p className="text-[10px] text-muted-foreground/60">
                {format(parseISO(a.created_at), 'd MMM yyyy')}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
