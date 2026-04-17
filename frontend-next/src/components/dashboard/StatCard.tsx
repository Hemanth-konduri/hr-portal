'use client'

import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  sub?: string
  icon: LucideIcon
  iconClass?: string
  trend?: string
  trendUp?: boolean
  className?: string
}

export function StatCard({ title, value, sub, icon: Icon, iconClass, trend, trendUp, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground tracking-tight leading-none">
              {value}
            </p>
            {sub && (
              <p className="text-[11px] text-muted-foreground leading-snug">{sub}</p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-[11px] font-semibold',
                trendUp ? 'text-emerald-600' : 'text-red-500'
              )}>
                {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {trend}
              </div>
            )}
          </div>
          <div className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            iconClass ?? 'bg-muted text-muted-foreground'
          )}>
            <Icon size={20} strokeWidth={1.8} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
