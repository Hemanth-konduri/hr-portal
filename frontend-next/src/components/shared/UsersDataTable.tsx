'use client'

import { useState, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search, MoreHorizontal, Pencil, PowerOff,
  ShieldOff, ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
import { User } from '@/types'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import api from '@/lib/api/axios'

const statusStyle: Record<string, string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive:  'bg-gray-100 text-gray-500 border-gray-200',
  suspended: 'bg-red-50 text-red-600 border-red-200',
}

const avatarColor: Record<string, string> = {
  super_admin: 'bg-amber-100 text-amber-800',
  admin:       'bg-blue-100 text-blue-800',
  employee:    'bg-violet-100 text-violet-800',
}

type SortField = 'full_name' | 'email' | 'department' | 'status' | 'date_of_joining'
type SortDir = 'asc' | 'desc'

interface Props {
  users: User[]
  loading: boolean
  onEdit: (user: User) => void
  onRefresh: () => void
  showRole?: boolean
  emptyMessage?: string
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="ml-1 text-muted-foreground/40" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="ml-1 text-foreground" />
    : <ChevronDown size={12} className="ml-1 text-foreground" />
}

export function UsersDataTable({ users, loading, onEdit, onRefresh, showRole = false, emptyMessage = 'No records found' }: Props) {
  const [search, setSearch]       = useState('')
  const [sortField, setSortField] = useState<SortField>('full_name')
  const [sortDir, setSortDir]     = useState<SortDir>('asc')
  const [confirmUser, setConfirmUser] = useState<{ user: User; action: 'toggle' | 'suspend' } | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users
      .filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.employee_id?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.position?.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const va = (a[sortField] || '') as string
        const vb = (b[sortField] || '') as string
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      })
  }, [users, search, sortField, sortDir])

  const handleConfirmedAction = async () => {
    if (!confirmUser) return
    const { user, action } = confirmUser
    setActionLoading(user.id)
    try {
      const newStatus = action === 'toggle'
        ? (user.status === 'active' ? 'inactive' : 'active')
        : 'suspended'
      await api.patch(`/users/${user.id}/status`, { status: newStatus })
      toast.success(`User ${newStatus === 'active' ? 'activated' : newStatus === 'inactive' ? 'deactivated' : 'suspended'}`)
      onRefresh()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Action failed')
    } finally {
      setActionLoading(null)
      setConfirmUser(null)
    }
  }

  const SortTh = ({ field, label }: { field: SortField; label: string }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap text-xs"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center">
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </TableHead>
  )

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <SortTh field="full_name" label="Employee" />
              <SortTh field="department" label="Department" />
              <TableHead className="text-xs">Position</TableHead>
              {showRole && <TableHead className="text-xs">Role</TableHead>}
              <SortTh field="date_of_joining" label="Joined" />
              <SortTh field="status" label="Status" />
              <TableHead className="text-xs w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showRole ? 7 : 6} className="py-16 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : filtered.map(user => (
              <TableRow key={user.id} className={cn('text-sm', actionLoading === user.id && 'opacity-50')}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={cn('text-xs font-bold', avatarColor[user.role] || 'bg-muted')}>
                        {user.full_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{user.full_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{user.employee_id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{user.department || '—'}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{user.position || '—'}</TableCell>
                {showRole && (
                  <TableCell>
                    <Badge variant="outline" className={cn('text-[10px]', avatarColor[user.role])}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                  {user.date_of_joining
                    ? format(parseISO(user.date_of_joining), 'd MMM yyyy')
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('text-[10px]', statusStyle[user.status])}>
                    <span className={cn(
                      'mr-1.5 h-1.5 w-1.5 rounded-full inline-block',
                      user.status === 'active' ? 'bg-emerald-500' :
                      user.status === 'suspended' ? 'bg-red-500' : 'bg-gray-400'
                    )} />
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onEdit(user)} className="text-xs gap-2">
                        <Pencil size={13} /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setConfirmUser({ user, action: 'toggle' })}
                        className="text-xs gap-2"
                      >
                        <PowerOff size={13} />
                        {user.status === 'active' ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      {user.status !== 'suspended' && (
                        <DropdownMenuItem
                          onClick={() => setConfirmUser({ user, action: 'suspend' })}
                          className="text-xs gap-2 text-destructive focus:text-destructive"
                        >
                          <ShieldOff size={13} /> Suspend
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-[11px] text-muted-foreground text-right">
        Showing {filtered.length} of {users.length} records
      </p>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmUser} onOpenChange={v => !v && setConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmUser?.action === 'suspend' ? 'Suspend User?' : confirmUser?.user.status === 'active' ? 'Deactivate User?' : 'Activate User?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser?.action === 'suspend'
                ? `${confirmUser.user.full_name} will be suspended and cannot log in.`
                : confirmUser?.user.status === 'active'
                ? `${confirmUser?.user.full_name} will be deactivated and cannot log in.`
                : `${confirmUser?.user.full_name} will be reactivated and can log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedAction}
              className={confirmUser?.action === 'suspend' ? 'bg-destructive hover:bg-destructive/90' : ''}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
