'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '@/lib/api/axios'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('OTP sent to your email')
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="shadow-md">
        <CardHeader className="pb-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-2">
            <Mail size={22} className="text-emerald-600" />
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We sent a 6-digit OTP to <span className="font-medium text-foreground">{email}</span>.
            It expires in 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}>
            Enter OTP
          </Button>
          <Button variant="ghost" className="w-full text-xs" onClick={() => setSent(false)}>
            Use a different email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Forgot password?</CardTitle>
        <CardDescription>Enter your email and we'll send you a reset OTP</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 size={15} className="animate-spin mr-2" />}
            Send OTP
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
            <ArrowLeft size={12} /> Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
