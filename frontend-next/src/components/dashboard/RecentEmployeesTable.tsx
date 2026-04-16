'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { User } from '@/types'
import { ArrowRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Props {
  employees: User[]
  limit?: number
  showLink?: boolean
}

const statusStyle: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive:  'bg-gray-100 text-gray-500 border-gray-200',
  suspended: 'bg-red-50 text-red-600 border-red-200',
}

export function RecentEmployeesTable({ employees, limit = 6, showLink = true }: Props) {
  const rows = [...employees]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, limit)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Recent Employees</CardTitle>
            <CardDescription className="text-xs">Latest {rows.length} additions</CardDescription>
          </div>
          {showLink && (
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs gap-1">
              <Link href="/admin/employees">View all <ArrowRight size={12} /></Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs pl-6">Employee</TableHead>
              <TableHead className="text-xs">Department</TableHead>
              <TableHead className="text-xs">Joined</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(emp => (
              <TableRow key={emp.id} className="text-xs">
                <TableCell className="pl-6">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[9px] font-bold bg-violet-100 text-violet-800">
                        {emp.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{emp.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{emp.employee_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{emp.department || '—'}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {emp.date_of_joining ? format(parseISO(emp.date_of_joining), 'd MMM yy') : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${statusStyle[emp.status]}`}>
                    {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
