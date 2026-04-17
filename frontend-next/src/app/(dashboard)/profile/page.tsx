'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api/axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  User, Mail, Phone, MapPin, Briefcase, Building2,
  CalendarDays, IdCard, ShieldCheck, KeyRound, Save,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

const roleLabel: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  employee:    'Employee',
}

const roleBadgeClass: Record<string, string> = {
  super_admin: 'bg-amber-100 text-amber-800 border-amber-200',
  admin:       'bg-blue-100 text-blue-800 border-blue-200',
  employee:    'bg-violet-100 text-violet-800 border-violet-200',
}

interface FullProfile {
  id: number
  employee_id: string
  full_name: string
  email: string
  role: string
  status: string
  department?: string
  position?: string
  phone?: string
  date_of_birth?: string
  date_of_joining?: string
  address?: string
  profile_photo?: string
  password_reset_required: boolean
}

function ProfilePageInner() {
  const { user, updateUser } = useAuth()
  const searchParams = useSearchParams()
  const defaultTab   = searchParams.get('tab') === 'security' ? 'security' : 'profile'

  const [profile,  setProfile]  = useState<FullProfile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  // Editable fields
  const [fullName,  setFullName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [address,   setAddress]   = useState('')
  const [dob,       setDob]       = useState('')

  // Password change
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/auth/me')
      setProfile(data)
      setFullName(data.full_name ?? '')
      setPhone(data.phone ?? '')
      setAddress(data.address ?? '')
      setDob(data.date_of_birth ? data.date_of_birth.split('T')[0] : '')
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSaveProfile = async () => {
    if (!fullName.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    try {
      const { data } = await api.put('/auth/me', {
        full_name:     fullName.trim(),
        phone:         phone.trim(),
        address:       address.trim(),
        date_of_birth: dob || null,
      })
      setProfile(data.user)
      updateUser({ full_name: data.user.full_name, phone: data.user.phone })
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { toast.error('All fields are required'); return }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setChangingPw(true)
    try {
      await api.post('/auth/change-password', {
        current_password: currentPw,
        new_password:     newPw,
      })
      toast.success('Password changed successfully')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to change password')
    } finally {
      setChangingPw(false)
    }
  }

  const initials = profile?.full_name
    ?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Profile Hero Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar className="h-20 w-20 border-2 border-border shrink-0">
              <AvatarFallback className="text-2xl font-bold bg-amber-100 text-amber-800">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground">{profile?.full_name}</h2>
                <Badge variant="outline" className={`text-[10px] ${roleBadgeClass[profile?.role ?? '']}`}>
                  {roleLabel[profile?.role ?? ''] ?? profile?.role}
                </Badge>
                <Badge variant="outline" className={`text-[10px] ${
                  profile?.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {profile?.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {profile?.employee_id && (
                  <span className="flex items-center gap-1">
                    <IdCard size={12} /> {profile.employee_id}
                  </span>
                )}
                {profile?.department && (
                  <span className="flex items-center gap-1">
                    <Building2 size={12} /> {profile.department}
                  </span>
                )}
                {profile?.position && (
                  <span className="flex items-center gap-1">
                    <Briefcase size={12} /> {profile.position}
                  </span>
                )}
                {profile?.date_of_joining && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} /> Joined {format(parseISO(profile.date_of_joining), 'd MMM yyyy')}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail size={12} /> {profile?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="h-9">
          <TabsTrigger value="profile"  className="text-xs gap-1.5"><User size={12} /> Profile Info</TabsTrigger>
          <TabsTrigger value="security" className="text-xs gap-1.5"><ShieldCheck size={12} /> Security</TabsTrigger>
        </TabsList>

        {/* Profile Info Tab */}
        <TabsContent value="profile" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Read-only info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Account Details</CardTitle>
                <CardDescription className="text-xs">Set by your administrator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: IdCard,      label: 'Employee ID',  value: profile?.employee_id },
                  { icon: Mail,        label: 'Email',        value: profile?.email },
                  { icon: Building2,   label: 'Department',   value: profile?.department || '—' },
                  { icon: Briefcase,   label: 'Position',     value: profile?.position || '—' },
                  { icon: CalendarDays,label: 'Date of Joining',
                    value: profile?.date_of_joining
                      ? format(parseISO(profile.date_of_joining), 'd MMM yyyy')
                      : '—'
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon size={13} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                      <p className="text-xs font-medium text-foreground mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Editable fields */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
                <CardDescription className="text-xs">Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Full Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input value={fullName} onChange={e => setFullName(e.target.value)}
                        className="pl-8 h-9 text-sm" placeholder="Your full name" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone Number</Label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input value={phone} onChange={e => setPhone(e.target.value)}
                        className="pl-8 h-9 text-sm" placeholder="+91 98765 43210" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Date of Birth</Label>
                    <Input type="date" value={dob} onChange={e => setDob(e.target.value)}
                      className="h-9 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Address</Label>
                  <div className="relative">
                    <MapPin size={13} className="absolute left-3 top-3 text-muted-foreground" />
                    <Textarea value={address} onChange={e => setAddress(e.target.value)}
                      className="pl-8 text-sm resize-none" rows={3}
                      placeholder="Your residential address..." />
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
                    <CardDescription className="text-xs">Use a strong password with mixed characters</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Current Password <span className="text-red-500">*</span></Label>
                  <Input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                    className="h-9 text-sm" placeholder="Enter current password" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">New Password <span className="text-red-500">*</span></Label>
                  <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                    className="h-9 text-sm" placeholder="Min 8 chars, upper, lower, number, symbol" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm New Password <span className="text-red-500">*</span></Label>
                  <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className="h-9 text-sm" placeholder="Repeat new password" />
                  {confirmPw && newPw !== confirmPw && (
                    <p className="text-[10px] text-red-500">Passwords do not match</p>
                  )}
                  {confirmPw && newPw === confirmPw && (
                    <p className="text-[10px] text-emerald-600">Passwords match ✓</p>
                  )}
                </div>
                <Button onClick={handleChangePassword} disabled={changingPw} className="w-full gap-2">
                  <KeyRound size={14} />
                  {changingPw ? 'Changing...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Security info card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Password Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    'At least 8 characters long',
                    'At least one uppercase letter (A–Z)',
                    'At least one lowercase letter (a–z)',
                    'At least one number (0–9)',
                    'At least one special character (@#$!%*?&)',
                  ].map(req => (
                    <li key={req} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Account Status</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Active & secure
                  </div>
                  {profile?.password_reset_required && (
                    <p className="text-[10px] text-amber-600 mt-1">
                      ⚠ Password change required on next login
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageInner />
    </Suspense>
  )
}
