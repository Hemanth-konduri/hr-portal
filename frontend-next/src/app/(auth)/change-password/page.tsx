'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api/axios'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChangePasswordPage() {
  const { user, isLoading, updateUser } = useAuth()
  const router = useRouter()

  const [currentPw,   setCurrentPw]   = useState('')
  const [newPw,       setNewPw]       = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [loading,     setLoading]     = useState(false)

  // Guard: must be logged in to access this page
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  const isForced = user?.password_reset_required === true

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    if (newPw.length < 8)    { toast.error('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: currentPw,
        new_password:     newPw,
      })
      toast.success('Password changed successfully')
      updateUser({ password_reset_required: false })

      const role = user?.role
      if (role === 'super_admin') router.replace('/super-admin/dashboard')
      else if (role === 'admin')  router.replace('/admin/dashboard')
      else                        router.replace('/employee/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mb-2">
          <ShieldCheck size={20} className="text-amber-600" />
        </div>
        <CardTitle className="text-xl">
          {isForced ? 'Set your new password' : 'Change password'}
        </CardTitle>
        <CardDescription>
          {isForced
            ? 'This is your first login. You must set a new password before continuing.'
            : 'Enter your current password and choose a new one.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Current password */}
          <div className="space-y-1.5">
            <Label htmlFor="currentPw">Current password</Label>
            <div className="relative">
              <Input
                id="currentPw"
                type={showCurrent ? 'text' : 'password'}
                placeholder="Your current password"
                required
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPw">New password</Label>
            <div className="relative">
              <Input
                id="newPw"
                type={showNew ? 'text' : 'password'}
                placeholder="Min 8 chars, upper, lower, number, symbol"
                required
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPw">Confirm new password</Label>
            <Input
              id="confirmPw"
              type="password"
              placeholder="Repeat new password"
              required
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
            />
            {confirmPw && newPw !== confirmPw && (
              <p className="text-[11px] text-red-500">Passwords do not match</p>
            )}
            {confirmPw && newPw === confirmPw && (
              <p className="text-[11px] text-emerald-600">Passwords match ✓</p>
            )}
          </div>

          {/* Password requirements */}
          <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Requirements</p>
            {[
              'At least 8 characters',
              'One uppercase letter (A–Z)',
              'One lowercase letter (a–z)',
              'One number (0–9)',
              'One special character (@#$!%*?&)',
            ].map(r => (
              <p key={r} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                {r}
              </p>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 size={15} className="animate-spin mr-2" />}
            {isForced ? 'Set Password & Continue' : 'Change Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
