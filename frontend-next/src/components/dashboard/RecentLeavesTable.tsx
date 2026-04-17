'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LeaveRequest } from '@/types'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Props {
  leaves: LeaveRequest[]
  limit?: number
  showLink?: boolean
}

const statusStyle: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
}

export function RecentLeavesTable({ leaves, limit = 6, showLink = true }: Props) {
  const rows = leaves.filter(l => l.status === 'pending').slice(0, limit)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Pending Leave Requests</CardTitle>
            <CardDescription className="text-xs">{rows.length} awaiting your approval</CardDescription>
          </div>
          {showLink && (
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1">
              <Link href="/admin/leaves">View all <ArrowRight size={12} /></Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <CheckCircle2 size={28} className="text-emerald-400" />
            <p className="text-xs">All caught up — no pending requests</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs pl-6">Employee</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Dates</TableHead>
                <TableHead className="text-xs">Days</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(l => (
                <TableRow key={l.id} className="text-xs">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[9px] font-bold bg-amber-100 text-amber-800">
                          {l.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{l.full_name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{l.employee_id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${l.leave_type === 'casual' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      {l.leave_type === 'casual' ? 'Casual' : 'LOP'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {format(parseISO(l.from_date), 'd MMM')} – {format(parseISO(l.to_date), 'd MMM')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.total_days}d</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${statusStyle[l.status]}`}>
                      {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
