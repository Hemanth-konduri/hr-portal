'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api/axios'
import { Document, DocumentType, DocumentVerificationStatus, User } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatCard } from '@/components/dashboard/StatCard'
import { toast } from 'sonner'
import {
  FileText, Upload, Trash2, Download, CheckCircle2,
  Clock, XCircle, AlertTriangle, Eye, RefreshCw,
  Search, Filter, StickyNote, ShieldCheck,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'aadhar',                label: 'Aadhar Card'           },
  { value: 'pan',                   label: 'PAN Card'              },
  { value: 'passport',              label: 'Passport'              },
  { value: 'driving_license',       label: 'Driving License'       },
  { value: 'resume',                label: 'Resume / CV'           },
  { value: 'education_certificate', label: 'Education Certificate' },
  { value: 'experience_letter',     label: 'Experience Letter'     },
  { value: 'offer_letter',          label: 'Offer Letter'          },
  { value: 'appointment_letter',    label: 'Appointment Letter'    },
  { value: 'bank_details',          label: 'Bank Details'          },
  { value: 'nda',                   label: 'NDA'                   },
  { value: 'contract',              label: 'Contract'              },
  { value: 'other',                 label: 'Other'                 },
]

const STATUS_STYLE: Record<DocumentVerificationStatus, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  expired:  'bg-gray-100 text-gray-500 border-gray-200',
}

interface DocStats {
  total: number
  pending: number
  verified: number
  rejected: number
  expired: number
  employees_with_docs: number
}

export default function AdminDocumentsPage() {
  const [docs,       setDocs]       = useState<Document[]>([])
  const [stats,      setStats]      = useState<DocStats | null>(null)
  const [employees,  setEmployees]  = useState<User[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter,   setTypeFilter]   = useState('all')
  const [empFilter,    setEmpFilter]    = useState('all')

  // Verify dialog
  const [verifyDoc,    setVerifyDoc]    = useState<Document | null>(null)
  const [verifyStatus, setVerifyStatus] = useState<DocumentVerificationStatus>('verified')
  const [hrNotes,      setHrNotes]      = useState('')
  const [verifying,    setVerifying]    = useState(false)

  // Notes dialog
  const [notesDoc,  setNotesDoc]  = useState<Document | null>(null)
  const [noteText,  setNoteText]  = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // Upload on behalf dialog
  const [uploadOpen,    setUploadOpen]    = useState(false)
  const [uploadEmp,     setUploadEmp]     = useState('')
  const [uploadDocType, setUploadDocType] = useState<DocumentType>('aadhar')
  const [uploadExpiry,  setUploadExpiry]  = useState('')
  const [uploading,     setUploading]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [docsRes, statsRes, empRes] = await Promise.all([
        api.get('/documents/all'),
        api.get('/documents/stats'),
        api.get('/users'),
      ])
      setDocs(docsRes.data)
      setStats(statsRes.data)
      setEmployees(empRes.data.filter((u: User) => u.role === 'employee'))
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Verify ────────────────────────────────────────────────
  const openVerify = (doc: Document, status: DocumentVerificationStatus) => {
    setVerifyDoc(doc)
    setVerifyStatus(status)
    setHrNotes(doc.hr_notes ?? '')
  }

  const submitVerify = async () => {
    if (!verifyDoc) return
    setVerifying(true)
    try {
      await api.patch(`/documents/${verifyDoc.id}/verify`, {
        status: verifyStatus,
        hr_notes: hrNotes.trim() || undefined,
      })
      toast.success(`Document ${verifyStatus}`)
      setVerifyDoc(null)
      fetchAll()
    } catch {
      toast.error('Action failed')
    } finally {
      setVerifying(false)
    }
  }

  // ── Notes ─────────────────────────────────────────────────
  const openNotes = (doc: Document) => {
    setNotesDoc(doc)
    setNoteText(doc.hr_notes ?? '')
  }

  const saveNotes = async () => {
    if (!notesDoc) return
    setSavingNote(true)
    try {
      await api.patch(`/documents/${notesDoc.id}/notes`, { hr_notes: noteText })
      toast.success('Notes saved')
      setNotesDoc(null)
      fetchAll()
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setSavingNote(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/documents/${id}`)
      toast.success('Document deleted')
      fetchAll()
    } catch {
      toast.error('Failed to delete')
    }
  }

  // ── Upload on behalf ──────────────────────────────────────
  const handleUploadOnBehalf = async () => {
    const file = fileRef.current?.files?.[0]
    if (!uploadEmp) { toast.error('Select an employee'); return }
    if (!file)      { toast.error('Select a file'); return }

    const fd = new FormData()
    fd.append('document', file)
    fd.append('document_type', uploadDocType)
    fd.append('user_id', uploadEmp)
    if (uploadExpiry) fd.append('expiry_date', uploadExpiry)

    setUploading(true)
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Document uploaded')
      setUploadOpen(false)
      if (fileRef.current) fileRef.current.value = ''
      fetchAll()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // ── Filter ────────────────────────────────────────────────
  const filtered = docs.filter(d => {
    if (statusFilter !== 'all' && d.verification_status !== statusFilter) return false
    if (typeFilter   !== 'all' && d.document_type !== typeFilter)          return false
    if (empFilter    !== 'all' && String(d.user_id) !== empFilter)         return false
    const q = search.toLowerCase()
    return !q || d.owner_name?.toLowerCase().includes(q) ||
                 d.employee_id?.toLowerCase().includes(q) ||
                 d.file_name?.toLowerCase().includes(q)
  })

  const pending  = docs.filter(d => d.verification_status === 'pending')
  const verified = docs.filter(d => d.verification_status === 'verified')
  const rejected = docs.filter(d => d.verification_status === 'rejected')

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Document Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Verify and manage employee documents</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2 h-9">
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-2 h-9">
            <Upload size={13} /> Upload for Employee
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Total Documents" value={stats?.total ?? 0}
            icon={FileText}     iconClass="bg-blue-50 text-blue-600"
            sub={`${stats?.employees_with_docs ?? 0} employees`} />
          <StatCard title="Pending Review"  value={stats?.pending ?? 0}
            icon={Clock}        iconClass="bg-amber-50 text-amber-600"
            sub="Awaiting verification"
            trend={stats?.pending ? `${stats.pending} need action` : 'All clear'}
            trendUp={!stats?.pending} />
          <StatCard title="Verified"        value={stats?.verified ?? 0}
            icon={CheckCircle2} iconClass="bg-emerald-50 text-emerald-600"
            sub="Approved documents" />
          <StatCard title="Rejected"        value={stats?.rejected ?? 0}
            icon={XCircle}      iconClass="bg-red-50 text-red-500"
            sub={`${stats?.expired ?? 0} expired`} />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Filter size={13} /> Filters
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all"      className="text-xs">All Status</SelectItem>
                <SelectItem value="pending"  className="text-xs">Pending</SelectItem>
                <SelectItem value="verified" className="text-xs">Verified</SelectItem>
                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                <SelectItem value="expired"  className="text-xs">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Doc Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                {DOC_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={empFilter} onValueChange={setEmpFilter}>
              <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="Employee" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Employees</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.id} value={String(e.id)} className="text-xs">{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative ml-auto">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-7 h-8 w-44 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="h-9 mb-4">
          <TabsTrigger value="all"      className="text-xs">All ({docs.length})</TabsTrigger>
          <TabsTrigger value="pending"  className="text-xs">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="verified" className="text-xs">Verified ({verified.length})</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        {(['all','pending','verified','rejected'] as const).map(tab => {
          const tabDocs = tab === 'all'
            ? filtered
            : filtered.filter(d => d.verification_status === tab)

          return (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold capitalize">
                    {tab === 'all' ? 'All Documents' : `${tab} Documents`}
                  </CardTitle>
                  <CardDescription className="text-xs">{tabDocs.length} records</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="space-y-2 p-4">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : tabDocs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                      <FileText size={32} className="opacity-20" />
                      <p className="text-sm">No documents found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="text-xs">Employee</TableHead>
                            <TableHead className="text-xs">Document</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Status</TableHead>
                            <TableHead className="text-xs">Expiry</TableHead>
                            <TableHead className="text-xs">HR Notes</TableHead>
                            <TableHead className="text-xs">Uploaded</TableHead>
                            <TableHead className="text-xs w-36">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tabDocs.map(doc => (
                            <TableRow key={doc.id} className="text-sm align-top">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarFallback className="text-[10px] font-bold bg-violet-100 text-violet-800">
                                      {doc.owner_name?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-semibold text-foreground whitespace-nowrap">{doc.owner_name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">{doc.employee_id}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-foreground max-w-[160px]">
                                <p className="truncate font-medium">{doc.file_name}</p>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {DOC_TYPES.find(t => t.value === doc.document_type)?.label ?? doc.document_type}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn('text-[10px] capitalize', STATUS_STYLE[doc.verification_status])}>
                                  {doc.verification_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {doc.expiry_date ? format(parseISO(doc.expiry_date), 'd MMM yyyy') : '—'}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[140px]">
                                {doc.hr_notes
                                  ? <p className="line-clamp-2 italic">"{doc.hr_notes}"</p>
                                  : <span className="text-muted-foreground/40">—</span>}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(parseISO(doc.created_at), 'd MMM yyyy')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {/* View */}
                                  <a href={`${API_BASE}${doc.file_path}`} target="_blank" rel="noreferrer">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-600" title="View">
                                      <Eye size={13} />
                                    </Button>
                                  </a>
                                  {/* Download */}
                                  <a href={`${API_BASE}${doc.file_path}`} download={doc.file_name}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Download">
                                      <Download size={13} />
                                    </Button>
                                  </a>
                                  {/* Verify */}
                                  {doc.verification_status !== 'verified' && (
                                    <Button variant="ghost" size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                                      title="Verify"
                                      onClick={() => openVerify(doc, 'verified')}>
                                      <CheckCircle2 size={13} />
                                    </Button>
                                  )}
                                  {/* Reject */}
                                  {doc.verification_status !== 'rejected' && (
                                    <Button variant="ghost" size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                      title="Reject"
                                      onClick={() => openVerify(doc, 'rejected')}>
                                      <XCircle size={13} />
                                    </Button>
                                  )}
                                  {/* Notes */}
                                  <Button variant="ghost" size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                                    title="Add Notes"
                                    onClick={() => openNotes(doc)}>
                                    <StickyNote size={13} />
                                  </Button>
                                  {/* Delete */}
                                  <Button variant="ghost" size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                    title="Delete"
                                    onClick={() => handleDelete(doc.id)}>
                                    <Trash2 size={13} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {!loading && tabDocs.length > 0 && (
                    <p className="text-[11px] text-muted-foreground text-right px-4 py-2">
                      {tabDocs.length} record{tabDocs.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Verify / Reject Dialog */}
      <Dialog open={!!verifyDoc} onOpenChange={v => !v && setVerifyDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck size={16} />
              {verifyStatus === 'verified' ? 'Verify Document' : 'Reject Document'}
            </DialogTitle>
          </DialogHeader>
          {verifyDoc && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">{verifyDoc.file_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {verifyDoc.owner_name} · {DOC_TYPES.find(t => t.value === verifyDoc.document_type)?.label}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Action</Label>
                <Select value={verifyStatus} onValueChange={v => setVerifyStatus(v as DocumentVerificationStatus)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verified" className="text-sm">✅ Verify</SelectItem>
                    <SelectItem value="rejected" className="text-sm">❌ Reject</SelectItem>
                    <SelectItem value="expired"  className="text-sm">⏰ Mark Expired</SelectItem>
                    <SelectItem value="pending"  className="text-sm">🔄 Reset to Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  HR Notes {verifyStatus === 'rejected' && <span className="text-red-500">*</span>}
                </Label>
                <Textarea value={hrNotes} onChange={e => setHrNotes(e.target.value)}
                  placeholder={verifyStatus === 'rejected'
                    ? 'Reason for rejection (required)...'
                    : 'Optional note for the employee...'}
                  rows={3} className="text-sm resize-none" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setVerifyDoc(null)} disabled={verifying}>Cancel</Button>
            <Button size="sm" onClick={submitVerify} disabled={verifying}
              className={verifyStatus === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                         verifyStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}>
              {verifying ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HR Notes Dialog */}
      <Dialog open={!!notesDoc} onOpenChange={v => !v && setNotesDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">HR Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{notesDoc?.file_name} · {notesDoc?.owner_name}</p>
            <Textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Add internal HR notes about this document..."
              rows={4} className="text-sm resize-none" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setNotesDoc(null)} disabled={savingNote}>Cancel</Button>
            <Button size="sm" onClick={saveNotes} disabled={savingNote}>
              {savingNote ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload on Behalf Dialog */}
      <Dialog open={uploadOpen} onOpenChange={v => !v && setUploadOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Upload Document for Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Employee <span className="text-red-500">*</span></Label>
              <Select value={uploadEmp} onValueChange={setUploadEmp}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={String(e.id)} className="text-sm">
                      {e.full_name}
                      <span className="text-muted-foreground font-mono text-xs ml-1">({e.employee_id})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Document Type <span className="text-red-500">*</span></Label>
              <Select value={uploadDocType} onValueChange={v => setUploadDocType(v as DocumentType)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Expiry Date (optional)</Label>
              <Input type="date" value={uploadExpiry} onChange={e => setUploadExpiry(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">File <span className="text-red-500">*</span></Label>
              <Input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="h-9 text-sm" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(false)} disabled={uploading}>Cancel</Button>
            <Button size="sm" onClick={handleUploadOnBehalf} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
