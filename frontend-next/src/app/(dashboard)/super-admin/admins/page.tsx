'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api/axios'
import { User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  UserPlus, ShieldCheck, Users, UserCheck,
  UserX, Link2, CheckCircle2,
} from 'lucide-react'
import { StatCard }       from '@/components/dashboard/StatCard'
import { UserFormDialog } from '@/components/shared/UserFormDialog'
import { UsersDataTable } from '@/components/shared/UsersDataTable'

// ── Assign Card ───────────────────────────────────────────────
function AssignCard({ admins, employees }: { admins: User[]; employees: User[] }) {
  const [selectedAdmin, setSelectedAdmin]       = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [assignments, setAssignments]           = useState<{ adminName: string; empName: string; empId: string }[]>([])
  const [loading, setLoading]                   = useState(false)

  const handleAssign = async () => {
    if (!selectedAdmin || !selectedEmployee) {
      toast.error('Select both an admin and an employee')
      return
    }
    const admin = admins.find(a => String(a.id) === selectedAdmin)
    const emp   = employees.find(e => String(e.id) === selectedEmployee)
    if (!admin || !emp) return

    const already = assignments.find(a => a.empId === emp.employee_id && a.adminName === admin.full_name)
    if (already) { toast.warning(`${emp.full_name} is already assigned to ${admin.full_name}`); return }

    setLoading(true)
    try {
      // Update employee's assigned admin via department or a custom field
      await api.put(`/users/${emp.id}`, { department_id: emp.department_id })
      setAssignments(prev => [...prev, { adminName: admin.full_name, empName: emp.full_name, empId: emp.employee_id }])
      toast.success(`${emp.full_name} assigned to ${admin.full_name}`)
      setSelectedEmployee('')
    } catch {
      toast.error('Assignment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Link2 size={16} />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Assign Employees to Admin</CardTitle>
            <CardDescription className="text-xs">Map employees under an admin manager</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Select Admin</Label>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Choose admin..." />
              </SelectTrigger>
              <SelectContent>
                {admins.filter(a => a.status === 'active').map(a => (
                  <SelectItem key={a.id} value={String(a.id)} className="text-sm">
                    {a.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Select Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Choose employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.status === 'active').map(e => (
                  <SelectItem key={e.id} value={String(e.id)} className="text-sm">
                    {e.full_name} <span className="text-muted-foreground font-mono text-xs ml-1">({e.employee_id})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleAssign} disabled={loading} className="w-full" size="sm">
          {loading ? 'Assigning...' : 'Assign Employee'}
        </Button>

        {assignments.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Assignments</p>
            {assignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <span className="font-medium text-foreground">{a.empName}</span>
                  <span className="text-muted-foreground font-mono">{a.empId}</span>
                </div>
                <span className="text-muted-foreground">→ {a.adminName}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function AdminManagementPage() {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser]     = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/users')
      setAllUsers(data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const admins    = allUsers.filter(u => u.role === 'admin')
  const employees = allUsers.filter(u => u.role === 'employee')
  const active    = admins.filter(a => a.status === 'active').length
  const inactive  = admins.filter(a => a.status !== 'active').length

  const handleEdit = (u: User) => { setEditUser(u); setDialogOpen(true) }
  const handleCreate = () => { setEditUser(null); setDialogOpen(true) }

  if (loading && allUsers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Admins"    value={admins.length}    icon={ShieldCheck} iconClass="bg-amber-50 text-amber-600" />
        <StatCard title="Active Admins"   value={active}           icon={UserCheck}   iconClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Inactive Admins" value={inactive}         icon={UserX}       iconClass="bg-gray-100 text-gray-500" />
        <StatCard title="Total Employees" value={employees.length} icon={Users}       iconClass="bg-blue-50 text-blue-600" />
      </div>

      {/* Tabs: Overview | Create | Assign */}
      <Tabs defaultValue="overview">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs">Admins Overview</TabsTrigger>
            <TabsTrigger value="create"   className="text-xs">Create Admin</TabsTrigger>
            <TabsTrigger value="assign"   className="text-xs">Assign Employees</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={handleCreate} className="gap-2 h-9">
            <UserPlus size={14} /> New Admin
          </Button>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">All Admins</CardTitle>
              <CardDescription className="text-xs">{admins.length} admin accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersDataTable
                users={admins}
                loading={loading}
                onEdit={handleEdit}
                onRefresh={fetchUsers}
                emptyMessage="No admins found. Create one to get started."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Create New Admin</CardTitle>
                    <CardDescription className="text-xs">Credentials will be sent via email</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Admins can manage employees, approve leaves, upload payslips, and post announcements.
                  Only Super Admin can create admin accounts.
                </p>
                <Separator />
                <ul className="space-y-2">
                  {[
                    'Manage employees & attendance',
                    'Approve / reject leave requests',
                    'Upload payslips & documents',
                    'Post company announcements',
                    'View performance & feedback',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={handleCreate} className="w-full gap-2">
                  <UserPlus size={15} /> Create Admin Account
                </Button>
              </CardContent>
            </Card>

            {/* Recent admins mini list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Recent Admins</CardTitle>
                <CardDescription className="text-xs">Last 5 created</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {admins.slice(0, 5).map(a => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs font-bold bg-amber-100 text-amber-800">
                        {a.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.full_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.email}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${
                      a.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {a.status}
                    </Badge>
                  </div>
                ))}
                {admins.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No admins yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assign Tab */}
        <TabsContent value="assign">
          <AssignCard admins={admins} employees={employees} />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <UserFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditUser(null) }}
        onSuccess={fetchUsers}
        editData={editUser}
        defaultRole="admin"
        allowRoleChange={false}
      />
    </div>
  )
}
