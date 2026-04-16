'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import api from '@/lib/api/axios'
import { Document, DocumentType, DocumentVerificationStatus } from '@/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/dashboard/StatCard'
import { toast } from 'sonner'
import {
  FileText, Upload, Trash2, Download, CheckCircle2,
  Clock, XCircle, AlertTriangle, Eye, RefreshCw,
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

const STATUS_ICON: Record<DocumentVerificationStatus, React.ReactNode> = {
  pending:  <Clock size={11} />,
  verified: <CheckCircle2 size={11} />,
  rejected: <XCircle size={11} />,
  expired:  <AlertTriangle size={11} />,
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['jpg','jpeg','png'].includes(ext ?? '')) return '🖼️'
  if (['doc','docx'].includes(ext ?? '')) return '📝'
  return '📎'
}

export default function EmployeeDocumentsPage() {
  const [docs,      setDocs]      = useState<Document[]>([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docType,   setDocType]   = useState<DocumentType>('aadhar')
  const [expiry,    setExpiry]    = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/documents/my')
      setDocs(data)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleUpload = async () => {
    const file = selectedFile
    if (!file) { toast.error('Please select a file'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB'); return }

    const fd = new FormData()
    fd.append('document', file)
    fd.append('document_type', docType)
    if (expiry) fd.append('expiry_date', expiry)

    setUploading(true)
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Document uploaded successfully')
      if (fileRef.current) fileRef.current.value = ''
      setSelectedFile(null)
      setExpiry('')
      fetchDocs()
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (doc: Document) => {
    try {
      await api.delete(`/documents/${doc.id}`)
      toast.success('Document deleted')
      fetchDocs()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const verified  = docs.filter(d => d.verification_status === 'verified').length
  const pending   = docs.filter(d => d.verification_status === 'pending').length
  const rejected  = docs.filter(d => d.verification_status === 'rejected').length

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-xl font-bold text-foreground">My Documents</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Upload and manage your HR documents</p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Verified"  value={verified} icon={CheckCircle2} iconClass="bg-emerald-50 text-emerald-600" sub="Approved by HR" />
          <StatCard title="Pending"   value={pending}  icon={Clock}        iconClass="bg-amber-50 text-amber-600"   sub="Awaiting review" />
          <StatCard title="Rejected"  value={rejected} icon={XCircle}      iconClass="bg-red-50 text-red-500"       sub="Needs re-upload" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Upload Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Upload size={15} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Upload Document</CardTitle>
                <CardDescription className="text-xs">PDF, JPG, PNG, DOC — max 10 MB</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Document Type <span className="text-red-500">*</span></Label>
              <Select value={docType} onValueChange={v => setDocType(v as DocumentType)}>
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
              <Input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="h-9 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">File <span className="text-red-500">*</span></Label>
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={20} className="text-muted-foreground mb-2" />
                {selectedFile ? (
                  <p className="text-xs font-medium text-foreground text-center truncate max-w-full px-2">{selectedFile.name}</p>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Click to select file</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <Button onClick={handleUpload} disabled={uploading} className="w-full gap-2">
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
            <Button variant="outline" size="sm" onClick={fetchDocs} className="gap-1.5 h-8 text-xs">
              <RefreshCw size={12} /> Refresh
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : docs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <FileText size={32} className="opacity-20" />
                <p className="text-sm">No documents uploaded yet</p>
                <p className="text-xs">Use the form to upload your first document</p>
              </CardContent>
            </Card>
          ) : (
            docs.map(doc => (
              <Card key={doc.id} className={cn(
                'transition-all',
                doc.verification_status === 'rejected' && 'border-red-200 bg-red-50/20',
                doc.verification_status === 'verified' && 'border-emerald-200',
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{fileIcon(doc.file_name)}</span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground truncate">{doc.file_name}</p>
                          <Badge variant="outline" className={cn('text-[10px] flex items-center gap-1', STATUS_STYLE[doc.verification_status])}>
                            {STATUS_ICON[doc.verification_status]}
                            {doc.verification_status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {DOC_TYPES.find(t => t.value === doc.document_type)?.label ?? doc.document_type}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                          <span>Uploaded {format(parseISO(doc.created_at), 'd MMM yyyy')}</span>
                          {doc.expiry_date && <span>Expires {format(parseISO(doc.expiry_date), 'd MMM yyyy')}</span>}
                          {doc.verified_by_name && <span>Reviewed by {doc.verified_by_name}</span>}
                        </div>
                        {doc.hr_notes && (
                          <p className="text-[11px] text-muted-foreground italic bg-muted/50 rounded px-2 py-1 mt-1">
                            HR Note: "{doc.hr_notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a href={`${API_BASE}${doc.file_path}`} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600">
                          <Eye size={14} />
                        </Button>
                      </a>
                      <a href={`${API_BASE}${doc.file_path}`} download={doc.file_name}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Download size={14} />
                        </Button>
                      </a>
                      {doc.verification_status === 'pending' && (
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleDelete(doc)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
