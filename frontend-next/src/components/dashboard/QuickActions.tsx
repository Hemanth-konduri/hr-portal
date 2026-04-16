'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Action {
  label: string
  href: string
  icon: LucideIcon
  iconClass: string
}

interface Props {
  actions: Action[]
  title?: string
}

export function QuickActions({ actions, title = 'Quick Actions' }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 pt-0">
        {actions.map(({ label, href, icon: Icon, iconClass }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 hover:bg-muted/50 hover:border-foreground/20 transition-all group">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconClass)}>
              <Icon size={16} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight group-hover:text-foreground transition-colors">
              {label}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
