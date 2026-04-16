'use client'

import { Card, CardContent } from '@/components/ui/card'

interface Props {
  name: string
  role: string
  stats: { label: string; value: string | number }[]
  message?: string
}

export function WelcomeBanner({ name, role, stats, message }: Props) {
  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Card className="border-0 bg-[#0f0f13] text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.12),_transparent_55%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[radial-gradient(ellipse,_rgba(99,102,241,0.08),_transparent_70%)] pointer-events-none" />
      <CardContent className="relative p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            {greeting()}, {role}
          </p>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {name.split(' ')[0]} 👋
          </h2>
          {message && (
            <p className="text-sm text-white/50 max-w-sm leading-relaxed">{message}</p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 min-w-[72px]">
              <p className="text-xl font-bold text-amber-400 leading-none">{value}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
