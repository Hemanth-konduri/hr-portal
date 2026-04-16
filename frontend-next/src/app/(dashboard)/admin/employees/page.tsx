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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  UserPlus, Users, UserCheck, UserX,
  Briefcase, Link2, CheckCircle2,
} from 'lucide-react'
import { StatCard }       from '@/components/dashboard/StatCard'
import { DepartmentBarChart } from '@/components/dashboard/DepartmentBarChart'
import { UserFormDialog } from '@/components/shared/UserFormDialog'
import { UsersDataTable } from '@/components/shared/UsersDataTable'

const DEPARTMENTS = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design', 'Legal']

// ── Assign Department Card ────────────────────────────────────
function AssignDepartmentCard({ employees }: { employees: User[] }) {
  const [selectedEmp,  setSelectedEmp]  = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [assignments,  setAssignments]  = useState<{ empName: string; dept: string; task: string }[]>([])
  const [loading, setLoading] = useState(false)

  const handleAssign = async () => {
    if (!selectedEmp || !selectedDept) {
      toast.error('Select an employee and a department')
      return
    }
    const emp = employees.find(e => String(e.id) === selectedEmp)
    if (!emp) return
    setLoading(true)
    try {
      await api.put(`/users/${emp.id}`, { department_id: selectedDept, position: selectedTask || emp.position })
      setAssignments(prev => [
        ...prev.filter(a => a.empName !== emp.full_name),
        { empName: emp.full_name, dept: selectedDept, task: selectedTask || 'General' },
      ])
      toast.success(`${emp.full_name} assigned to ${selectedDept}`)
      setSelectedEmp(''); setSelectedDept(''); setSelectedTask('')
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Link2 size={16} />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Assign Department / Role</CardTitle>
            <CardDescription className="text-xs">Assign employees to departments or tasks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Employee</Label>
            <Select value={selectedEmp} onValueChange={setSelectedEmp}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.status === 'active').map(e => (
                  <SelectItem key={e.id} value={String(e.id)} className="text-sm">
                    {e.full_name}
                    <span className="text-muted-foreground font-mono text-xs ml-1">({e.employee_id})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Department</Label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select department..." />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map(d => <SelectItem key={d} value={d} className="text-sm">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Task / Role (optional)</Label>
            <Input
              placeholder="e.g. Frontend Developer, HR Executive..."
              value={selectedTask}
              onChange={e => setSelectedTask(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <Button onClick={handleAssign} disabled={loading} className="w-full" size="sm">
          {loading ? 'Assigning...' : 'Assign'}
        </Button>

        {assignments.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Assignments</p>
            {assignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <span className="font-medium text-foreground">{a.empName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">{a.dept}</Badge>
                  <span className="text-muted-foreground">{a.task}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function EmployeeManagementPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

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

  const employees = allUsers.filter(u => u.role === 'employee')
  const active    = employees.filter(e => e.status === 'active').length
  const inactive  = employees.filter(e => e.status === 'inactive').length
  const suspended = employees.filter(e => e.status === 'suspended').length

  const handleEdit   = (u: User) => { setEditUser(u); setDialogOpen(true) }
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
        <StatCard title="Total Employees" value={employees.length} icon={Users}     iconClass="bg-blue-50 text-blue-600"
          sub={`${active} active · ${inactive + suspended} inactive`} />
        <StatCard title="Active"          value={active}           icon={UserCheck} iconClass="bg-emerald-50 text-emerald-600"
          trend={`${Math.round((active / (employees.length || 1)) * 100)}% of total`} trendUp />
        <StatCard title="Inactive"        value={inactive}         icon={UserX}     iconClass="bg-gray-100 text-gray-500" />
        <StatCard title="Suspended"       value={suspended}        icon={Briefcase} iconClass="bg-red-50 text-red-500" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="overview"    className="text-xs">All Employees</TabsTrigger>
            <TabsTrigger value="create"      className="text-xs">Create Employee</TabsTrigger>
            <TabsTrigger value="assign"      className="text-xs">Assign Department</TabsTrigger>
            <TabsTrigger value="departments" className="text-xs">Departments</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={handleCreate} className="gap-2 h-9">
            <UserPlus size={14} /> New Employee
          </Button>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Employee Directory</CardTitle>
              <CardDescription className="text-xs">{employees.length} total employees</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersDataTable
                users={employees}
                loading={loading}
                onEdit={handleEdit}
                onRefresh={fetchUsers}
                emptyMessage="No employees found. Create one to get started."
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Create New Employee</CardTitle>
                    <CardDescription className="text-xs">Credentials will be sent via email</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fill in the details to register a new employee. A secure temporary password
                  will be auto-generated and emailed. They must change it on first login.
                </p>
                <Separator />
                <ul className="space-y-2">
                  {[
                    'Auto-generated Employee ID (EMP001...)',
                    'Temporary password emailed securely',
                    'Forced password change on first login',
                    '1 Casual Leave auto-assigned',
                    'Appears in attendance & payroll system',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={handleCreate} className="w-full gap-2">
                  <UserPlus size={15} /> Create Employee Account
                </Button>
              </CardContent>
            </Card>

            {/* Recent employees mini list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Recently Added</CardTitle>
                <CardDescription className="text-xs">Last 5 employees</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...employees]
                  .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                  .slice(0, 5)
                  .map(e => (
                    <div key={e.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs font-bold bg-violet-100 text-violet-800">
                          {e.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{e.full_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{e.department || e.position || 'Employee'}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${
                        e.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {e.status}
                      </Badge>
                    </div>
                  ))}
                {employees.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No employees yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assign Tab */}
        <TabsContent value="assign">
          <AssignDepartmentCard employees={employees} />
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <DepartmentBarChart employees={employees} />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <UserFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditUser(null) }}
        onSuccess={fetchUsers}
        editData={editUser}
        defaultRole="employee"
        allowRoleChange={isSuperAdmin}
      />
    </div>
  )
}
