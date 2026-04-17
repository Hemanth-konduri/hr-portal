'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { PerformanceReview } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartConfig, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell,
} from 'recharts'
import { toast } from 'sonner'
import { Award, TrendingUp, Star, MessageSquare, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}
        />
      ))}
    </div>
  )
}

interface Stats {
  total_reviews: number
  avg_rating: number
  highest_rating: number
  lowest_rating: number
  excellent: number
  good: number
  average: number
  needs_improvement: number
}

const trendConfig: ChartConfig = {
  rating: { label: 'Rating', color: '#f59e0b' },
}
const distConfig: ChartConfig = {
  count: { label: 'Reviews', color: '#6366f1' },
}
const radarConfig: ChartConfig = {
  rating: { label: 'Rating', color: '#10b981' },
}

export default function EmployeePerformancePage() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [revRes, statRes] = await Promise.all([
        api.get('/performance/my'),
        api.get('/performance/my/stats'),
      ])
      setReviews(revRes.data)
      setStats(statRes.data)
    } catch {
      toast.error('Failed to load performance data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Chart data ────────────────────────────────────────────
  const trendData = [...reviews]
    .reverse()
    .map(r => ({ period: r.period, rating: r.rating }))

  const distData = [5, 4, 3, 2, 1].map(r => ({
    label: RATING_LABEL[r],
    count: reviews.filter(x => x.rating === r).length,
    fill:  RATING_BAR_COLOR[r],
  }))

  const radarData = [
    { subject: 'Excellent (5)', value: stats?.excellent ?? 0 },
    { subject: 'Good (4)',      value: stats?.good ?? 0 },
    { subject: 'Average (3)',   value: stats?.average ?? 0 },
    { subject: 'Needs Imp.',    value: stats?.needs_improvement ?? 0 },
  ]

  const avgRating = Number(stats?.avg_rating ?? 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">My Performance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Track your performance reviews and ratings over time</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 h-9">
          <RefreshCw size={13} /> Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Reviews"
          value={stats?.total_reviews ?? 0}
          icon={MessageSquare}
          iconClass="bg-blue-50 text-blue-600"
          sub="All time"
        />
        <StatCard
          title="Average Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
          icon={Star}
          iconClass="bg-amber-50 text-amber-600"
          sub={avgRating > 0 ? RATING_LABEL[Math.round(avgRating)] : 'No reviews yet'}
          trend={avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0` : undefined}
          trendUp={avgRating >= 3.5}
        />
        <StatCard
          title="Highest Rating"
          value={stats?.highest_rating ?? '—'}
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
          sub={stats?.highest_rating ? RATING_LABEL[stats.highest_rating] : 'No reviews yet'}
        />
        <StatCard
          title="Excellent Reviews"
          value={stats?.excellent ?? 0}
          icon={Award}
          iconClass="bg-violet-50 text-violet-600"
          sub={`${stats?.good ?? 0} good · ${stats?.average ?? 0} average`}
        />
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <Award size={40} className="opacity-20" />
            <p className="text-sm font-medium">No performance reviews yet</p>
            <p className="text-xs">Your manager will add reviews here</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

            {/* Rating Trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Rating Trend</CardTitle>
                <CardDescription className="text-xs">Your rating over each review period</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={trendConfig} className="h-[220px] w-full">
                  <LineChart data={trendData} margin={{ top: 8, left: 0, right: 16, bottom: 8 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                    <ReferenceLine y={3} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 2" strokeOpacity={0.4} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="rating"
                      stroke="var(--color-rating)"
                      strokeWidth={2.5}
                      dot={{ r: 5, fill: 'var(--color-rating)', strokeWidth: 0 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Rating Distribution</CardTitle>
                <CardDescription className="text-xs">Breakdown by rating category</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ChartContainer config={radarConfig} className="h-[220px] w-full">
                  <RadarChart data={radarData} margin={{ top: 16, right: 32, bottom: 16, left: 32 }}>
                    <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke="var(--color-rating)"
                      fill="var(--color-rating)"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart — count per rating */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Reviews by Rating</CardTitle>
              <CardDescription className="text-xs">How many reviews you received at each rating level</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer config={distConfig} className="h-[180px] w-full">
                <BarChart data={distData} barSize={28} margin={{ top: 4, left: 0, right: 8, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tickFormatter={v => v === 'Needs Improvement' ? 'Needs Imp.' : v}
                  />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Review History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Review History</CardTitle>
              <CardDescription className="text-xs">{reviews.length} review{reviews.length !== 1 ? 's' : ''} received</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reviews.map((r, i) => (
                <div key={r.id}>
                  <div className="flex items-start justify-between gap-4 py-1">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{r.period}</p>
                        <Badge variant="outline" className={cn('text-[10px]', RATING_COLOR[r.rating])}>
                          {RATING_LABEL[r.rating]}
                        </Badge>
                      </div>
                      <StarRating rating={r.rating} />
                      {r.feedback && (
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                          "{r.feedback}"
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        Reviewed by <span className="font-medium text-foreground">{r.reviewer_name ?? 'Admin'}</span>
                        {' · '}{format(parseISO(r.created_at), 'd MMM yyyy')}
                      </p>
                    </div>
                    <div className="text-3xl font-bold shrink-0" style={{ color: RATING_BAR_COLOR[r.rating] }}>
                      {r.rating}
                      <span className="text-sm text-muted-foreground font-normal">/5</span>
                    </div>
                  </div>
                  {i < reviews.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
