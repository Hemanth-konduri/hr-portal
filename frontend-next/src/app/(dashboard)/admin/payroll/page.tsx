'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api/axios'
import { Payslip } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatCard } from '@/components/dashboard/StatCard'
import { toast } from 'sonner'
import {
  DollarSign, Users, TrendingDown, RefreshCw,
  Download, Trash2, Search, Filter, FileText, Settings,
} from 'lucide-react'
import { format } from 'date-fns'

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

interface SalaryRow {
  id: number
  full_name: string
  employee_id: string
  department: string
  position: string
  basic: number | null
  hra: number | null
  allowances: number | null
  gross_salary: number | null
  effective_from: string | null
}

interface PayrollStats {
  employees_paid: number
  total_gross: number
  total_deductions: number
  total_net: number
  total_lop_days: number
  total_structured: number
}

interface PayslipRow extends Payslip {
  full_name: string
  employee_id: string
  department: string
}

export default function AdminPayrollPage() {
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year,  setYear]  = useState(String(now.getFullYear()))
  const [search, setSearch] = useState('')

  const [stats,      setStats]      = useState<PayrollStats | null>(null)
  const [structures, setStructures] = useState<SalaryRow[]>([])
  const [payslips,   setPayslips]   = useState<PayslipRow[]>([])
  const [loading,    setLoading]    = useState(true)

  // Salary structure dialog
  const [structDialog, setStructDialog] = useState(false)
  const [structEmp,    setStructEmp]    = useState('')
  const [basic,        setBasic]        = useState('')
  const [hra,          setHra]          = useState('')
  const [allowances,   setAllowances]   = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(format(now, 'yyyy-MM-dd'))
  const [savingStruct, setSavingStruct] = useState(false)

  // Generate payslip dialog
  const [genDialog, setGenDialog] = useState(false)
  const [genEmp,    setGenEmp]    = useState('')
  const [genMonth,  setGenMonth]  = useState(String(now.getMonth() + 1))
  const [genYear,   setGenYear]   = useState(String(now.getFullYear()))
  const [generating, setGenerating] = useState(false)

  const years = Array.from({ length: 4 }, (_, i) => String(now.getFullYear() - i))

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, structRes, payRes] = await Promise.all([
        api.get('/payslips/stats', { params: { month, year } }),
        api.get('/payslips/structures'),
        api.get('/payslips/all', { params: { month, year } }),
      ])
      setStats(statsRes.data)
      setStructures(structRes.data)
      setPayslips(payRes.data)
    } catch {
      toast.error('Failed to load payroll data')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openStructDialog = (row?: SalaryRow) => {
    if (row) {
      setStructEmp(String(row.id))
      setBasic(String(row.basic ?? ''))
      setHra(String(row.hra ?? ''))
      setAllowances(String(row.allowances ?? ''))
      setEffectiveFrom(row.effective_from?.split('T')[0] ?? format(now, 'yyyy-MM-dd'))
    } else {
      setStructEmp(''); setBasic(''); setHra(''); setAllowances('')
      setEffectiveFrom(format(now, 'yyyy-MM-dd'))
    }
    setStructDialog(true)
  }

  const saveStructure = async () => {
    if (!structEmp || !basic || !hra || !allowances) {
      toast.error('All fields are required')
      return
    }
    setSavingStruct(true)
    try {
      await api.post('/payslips/structure', {
        user_id: structEmp,
        basic: Number(basic),
        hra: Number(hra),
        allowances: Number(allowances),
        effective_from: effectiveFrom,
      })
      toast.success('Salary structure saved')
      setStructDialog(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to save structure')
    } finally {
      setSavingStruct(false)
    }
  }

  const generatePayslip = async () => {
    if (!genEmp) { toast.error('Select an employee'); return }
    setGenerating(true)
    try {
      const res = await api.post('/payslips/generate', {
        user_id: genEmp,
        month: genMonth,
        year: genYear,
      })
      toast.success(`Payslip generated — Net: ₹${Number(res.data.net_salary).toLocaleString()}`)
      setGenDialog(false)
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Failed to generate payslip')
    } finally {
      setGenerating(false)
    }
  }

  const deletePayslip = async (id: number) => {
    try {
      await api.delete(`/payslips/${id}`)
      toast.success('Payslip deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete payslip')
    }
  }

  const exportCSV = () => {
    const header = 'Employee,ID,Department,Month,Year,Gross,LOP Days,Deduction,Net\n'
    const rows = filteredPayslips.map(p =>
      `"${p.full_name}","${p.employee_id}","${p.department ?? ''}",${p.month},${p.year},${p.gross_salary},${p.lop_days},${p.lop_deduction},${p.net_salary}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `payroll-${year}-${month}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filteredPayslips = payslips.filter(p => {
    const q = search.toLowerCase()
    return !q || p.full_name?.toLowerCase().includes(q) || p.employee_id?.toLowerCase().includes(q)
  })

  const filteredStructures = structures.filter(s => {
    const q = search.toLowerCase()
    return !q || s.full_name?.toLowerCase().includes(q) || s.employee_id?.toLowerCase().includes(q)
  })

  const gross = (b: number, h: number, a: number) => Number(b) + Number(h) + Number(a)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage salary structures and generate payslips</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 h-9">
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setGenDialog(true)} className="gap-2 h-9">
            <FileText size={13} /> Generate Payslip
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Filter size={13} /> Period
            </div>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative ml-auto">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-7 h-8 w-48 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Employees Paid"   value={stats?.employees_paid ?? 0}
            icon={Users}        iconClass="bg-blue-50 text-blue-600"
            sub={`of ${stats?.total_structured ?? 0} structured`} />
          <StatCard title="Total Gross"      value={`₹${Number(stats?.total_gross ?? 0).toLocaleString()}`}
            icon={DollarSign}   iconClass="bg-emerald-50 text-emerald-600"
            sub={`${MONTHS[+month - 1]} ${year}`} />
          <StatCard title="Total Deductions" value={`₹${Number(stats?.total_deductions ?? 0).toLocaleString()}`}
            icon={TrendingDown} iconClass="bg-red-50 text-red-500"
            sub={`${stats?.total_lop_days ?? 0} LOP days`} />
          <StatCard title="Net Payroll"      value={`₹${Number(stats?.total_net ?? 0).toLocaleString()}`}
            icon={DollarSign}   iconClass="bg-violet-50 text-violet-600"
            sub="Total net disbursed" />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="payslips">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="h-9">
            <TabsTrigger value="payslips"   className="text-xs">Payslips ({payslips.length})</TabsTrigger>
            <TabsTrigger value="structures" className="text-xs">Salary Structures ({structures.length})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2 h-8 text-xs">
              <Download size={12} /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => openStructDialog()} className="gap-2 h-8 text-xs">
              <Settings size={12} /> Set Salary
            </Button>
          </div>
        </div>

        {/* Payslips Tab */}
        <TabsContent value="payslips">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Payslips — {MONTHS[+month - 1]} {year}</CardTitle>
              <CardDescription className="text-xs">{filteredPayslips.length} records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs">Employee</TableHead>
                        <TableHead className="text-xs">Department</TableHead>
                        <TableHead className="text-xs text-right">Gross</TableHead>
                        <TableHead className="text-xs text-center">LOP Days</TableHead>
                        <TableHead className="text-xs text-right">Deduction</TableHead>
                        <TableHead className="text-xs text-right">Net Salary</TableHead>
                        <TableHead className="text-xs w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayslips.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                            No payslips generated for {MONTHS[+month - 1]} {year}.
                          </TableCell>
                        </TableRow>
                      ) : filteredPayslips.map(p => (
                        <TableRow key={p.id} className="text-sm">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-[10px] font-bold bg-violet-100 text-violet-800">
                                  {p.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-semibold text-foreground whitespace-nowrap">{p.full_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{p.employee_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{p.department || '—'}</TableCell>
                          <TableCell className="text-xs text-right font-mono">₹{Number(p.gross_salary).toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            {p.lop_days > 0 ? (
                              <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200">
                                {p.lop_days}d
                              </Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono text-red-500">
                            {p.lop_deduction > 0 ? `-₹${Number(p.lop_deduction).toLocaleString()}` : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-sm font-bold text-emerald-600">₹{Number(p.net_salary).toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                              onClick={() => deletePayslip(p.id)}>
                              <Trash2 size={13} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {!loading && filteredPayslips.length > 0 && (
                <p className="text-[11px] text-muted-foreground text-right px-4 py-2">
                  {filteredPayslips.length} record{filteredPayslips.length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Salary Structures Tab */}
        <TabsContent value="structures">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Salary Structures</CardTitle>
              <CardDescription className="text-xs">{filteredStructures.length} employees</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs">Employee</TableHead>
                        <TableHead className="text-xs">Department</TableHead>
                        <TableHead className="text-xs text-right">Basic</TableHead>
                        <TableHead className="text-xs text-right">HRA</TableHead>
                        <TableHead className="text-xs text-right">Allowances</TableHead>
                        <TableHead className="text-xs text-right">Gross</TableHead>
                        <TableHead className="text-xs">Effective From</TableHead>
                        <TableHead className="text-xs w-16">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStructures.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                            No salary structures found.
                          </TableCell>
                        </TableRow>
                      ) : filteredStructures.map(s => (
                        <TableRow key={s.id} className="text-sm">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-[10px] font-bold bg-blue-100 text-blue-800">
                                  {s.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-semibold text-foreground whitespace-nowrap">{s.full_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{s.employee_id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.department || '—'}</TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {s.basic != null ? `₹${Number(s.basic).toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {s.hra != null ? `₹${Number(s.hra).toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {s.allowances != null ? `₹${Number(s.allowances).toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.gross_salary != null ? (
                              <span className="text-xs font-bold text-emerald-600">₹{Number(s.gross_salary).toLocaleString()}</span>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Not set</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {s.effective_from ? format(new Date(s.effective_from), 'd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]"
                              onClick={() => openStructDialog(s)}>
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Set Salary Structure Dialog */}
      <Dialog open={structDialog} onOpenChange={v => !v && setStructDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Set Salary Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Employee <span className="text-red-500">*</span></Label>
              <Select value={structEmp} onValueChange={setStructEmp}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {structures.map(s => (
                    <SelectItem key={s.id} value={String(s.id)} className="text-sm">
                      {s.full_name}
                      <span className="text-muted-foreground font-mono text-xs ml-1">({s.employee_id})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Basic (₹)', value: basic, set: setBasic },
                { label: 'HRA (₹)',   value: hra,   set: setHra   },
                { label: 'Allowances (₹)', value: allowances, set: setAllowances },
              ].map(f => (
                <div key={f.label} className="space-y-1.5">
                  <Label className="text-xs">{f.label} <span className="text-red-500">*</span></Label>
                  <Input type="number" min="0" value={f.value} onChange={e => f.set(e.target.value)}
                    className="h-9 text-sm" placeholder="0" />
                </div>
              ))}
            </div>
            {basic && hra && allowances && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 font-medium">
                Gross Salary: ₹{gross(+basic, +hra, +allowances).toLocaleString()}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Effective From</Label>
              <Input type="date" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)}
                className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setStructDialog(false)} disabled={savingStruct}>Cancel</Button>
            <Button size="sm" onClick={saveStructure} disabled={savingStruct}>
              {savingStruct ? 'Saving...' : 'Save Structure'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Payslip Dialog */}
      <Dialog open={genDialog} onOpenChange={v => !v && setGenDialog(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Generate Payslip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Employee <span className="text-red-500">*</span></Label>
              <Select value={genEmp} onValueChange={setGenEmp}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {structures.filter(s => s.gross_salary != null).map(s => (
                    <SelectItem key={s.id} value={String(s.id)} className="text-sm">
                      {s.full_name}
                      <span className="text-muted-foreground font-mono text-xs ml-1">({s.employee_id})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Month</Label>
                <Select value={genMonth} onValueChange={setGenMonth}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)} className="text-xs">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Year</Label>
                <Select value={genYear} onValueChange={setGenYear}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              LOP deductions will be auto-calculated from attendance records.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setGenDialog(false)} disabled={generating}>Cancel</Button>
            <Button size="sm" onClick={generatePayslip} disabled={generating}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
