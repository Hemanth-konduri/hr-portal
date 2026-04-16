'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Mail, User, Phone, Briefcase, Building2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api/axios'
import { User as UserType } from '@/types'

const DEPARTMENTS = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design', 'Legal']

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editData?: UserType | null
  defaultRole?: 'admin' | 'employee'
  allowRoleChange?: boolean
}

interface FormState {
  full_name: string
  email: string
  role: string
  position: string
  phone: string
  department_id: string
  date_of_joining: string
}

const empty: FormState = {
  full_name: '', email: '', role: 'employee',
  position: '', phone: '', department_id: '', date_of_joining: '',
}

export function UserFormDialog({ open, onClose, onSuccess, editData, defaultRole = 'employee', allowRoleChange = false }: Props) {
  const isEdit = !!editData
  const [form, setForm] = useState<FormState>({ ...empty, role: defaultRole })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({
          full_name:       editData.full_name       || '',
          email:           editData.email           || '',
          role:            editData.role            || defaultRole,
          position:        editData.position        || '',
          phone:           editData.phone           || '',
          department_id:   editData.department      || '',
          date_of_joining: editData.date_of_joining ? editData.date_of_joining.split('T')[0] : '',
        })
      } else {
        setForm({ ...empty, role: defaultRole })
      }
    }
  }, [open, editData, defaultRole])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/users/${editData!.id}`, form)
        toast.success('User updated successfully')
      } else {
        await api.post('/users/create', form)
        toast.success(`${form.role === 'admin' ? 'Admin' : 'Employee'} created! Credentials sent to ${form.email}`)
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit User' : `Create ${form.role === 'admin' ? 'Admin' : 'Employee'}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the user details below.'
              : 'A secure temporary password will be auto-generated and emailed.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Role selector — only shown when creating and allowRoleChange is true */}
          {!isEdit && allowRoleChange && (
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="full_name">Full Name *</Label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="full_name" placeholder="John Doe" required
                  className="pl-8" value={form.full_name} onChange={set('full_name')} />
              </div>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="john@company.com" required
                  className="pl-8" value={form.email} onChange={set('email')} disabled={isEdit} />
              </div>
              {isEdit && <p className="text-[11px] text-muted-foreground">Email cannot be changed</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="position">Position</Label>
              <div className="relative">
                <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="position" placeholder="e.g. Developer"
                  className="pl-8" value={form.position} onChange={set('position')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="phone" placeholder="+91 9999999999"
                  className="pl-8" value={form.phone} onChange={set('phone')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}>
                <SelectTrigger>
                  <Building2 size={14} className="mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date_of_joining">Date of Joining</Label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="date_of_joining" type="date"
                  className="pl-8" value={form.date_of_joining} onChange={set('date_of_joining')} />
              </div>
            </div>
          </div>

          {!isEdit && (
            <p className="text-[11px] text-muted-foreground bg-muted rounded-lg px-3 py-2">
              🔐 A secure temporary password will be auto-generated and sent to the email above. The user must change it on first login.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin mr-2" />}
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create & Send Email'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
