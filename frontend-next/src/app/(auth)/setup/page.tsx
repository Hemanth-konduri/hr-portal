'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api/axios'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function SetupPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  // Check if setup is already done — if so redirect to login
  useEffect(() => {
    api.get('/auth/setup-status').then(({ data }) => {
      if (data.setup_completed) router.replace('/login')
      else setChecking(false)
    }).catch(() => setChecking(false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/setup', {
        full_name: form.full_name,
        email:     form.email,
        password:  form.password,
      })
      login(data.token, data.user)
      toast.success('Super Admin account created!')
      router.replace('/super-admin/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Setup failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mb-2">
          <ShieldCheck size={20} className="text-amber-600" />
        </div>
        <CardTitle className="text-xl">First-time Setup</CardTitle>
        <CardDescription>Create the Super Admin account. This can only be done once.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" placeholder="Your full name" required
              value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="admin@company.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPass ? 'text' : 'password'}
                placeholder="Min 8 chars, upper, lower, number, symbol" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="pr-10" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <Input id="confirm" type="password" placeholder="Repeat password" required
              value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
            {form.confirm && form.password !== form.confirm && (
              <p className="text-[11px] text-red-500">Passwords do not match</p>
            )}
            {form.confirm && form.password === form.confirm && (
              <p className="text-[11px] text-emerald-600">Passwords match ✓</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 size={15} className="animate-spin mr-2" />}
            Create Super Admin
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
