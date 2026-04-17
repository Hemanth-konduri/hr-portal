'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api/axios'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react'

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const emailParam   = searchParams.get('email') || ''

  const [email,     setEmail]     = useState(emailParam)
  const [otp,       setOtp]       = useState('')
  const [newPass,   setNewPass]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass !== confirmPw) { toast.error('Passwords do not match'); return }
    if (newPass.length < 8)    { toast.error('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        token:        otp,
        new_password: newPass,
      })
      setSuccess(true)
      toast.success('Password reset successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-2">
            <CheckCircle2 size={22} className="text-emerald-600" />
          </div>
          <CardTitle className="text-xl">Password reset!</CardTitle>
          <CardDescription>Your password has been changed successfully. You can now log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>Enter the OTP sent to your email and choose a new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email — prefilled but editable */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {/* OTP */}
          <div className="space-y-1.5">
            <Label htmlFor="otp">6-digit OTP</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              required
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="tracking-[0.4em] text-center font-mono text-lg"
            />
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPass">New password</Label>
            <div className="relative">
              <Input
                id="newPass"
                type={showPass ? 'text' : 'password'}
                placeholder="Min 8 chars, upper, lower, number, symbol"
                required
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
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
            {confirmPw && newPass !== confirmPw && (
              <p className="text-[11px] text-red-500">Passwords do not match</p>
            )}
            {confirmPw && newPass === confirmPw && (
              <p className="text-[11px] text-emerald-600">Passwords match ✓</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 size={15} className="animate-spin mr-2" />}
            Reset Password
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
            <ArrowLeft size={12} /> Resend OTP
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
