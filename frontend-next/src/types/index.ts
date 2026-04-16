export type Role = 'super_admin' | 'admin' | 'employee'
export type Status = 'active' | 'inactive' | 'suspended'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'
export type LeaveType = 'casual' | 'lop'
export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'lop' | 'holiday' | 'weekend'

export interface User {
  id: number
  employee_id: string
  full_name: string
  email: string
  role: Role
  status: Status
  department?: string
  department_id?: number
  position?: string
  phone?: string
  date_of_birth?: string
  date_of_joining?: string
  profile_photo?: string
  address?: string
  password_reset_required: boolean
  created_at?: string
}

export interface AuthUser extends User {}

export interface LeaveRequest {
  id: number
  user_id: number
  full_name: string
  employee_id: string
  leave_type: LeaveType
  from_date: string
  to_date: string
  total_days: number
  reason: string
  status: LeaveStatus
  review_remark?: string
  reviewed_at?: string
  created_at: string
}

export interface LeaveBalance {
  casual_total: number
  casual_used: number
  casual_remaining: number
  lop_count: number
}

export interface AttendanceRecord {
  id: number
  user_id: number
  full_name: string
  employee_id: string
  date: string
  check_in_time?: string
  check_out_time?: string
  check_in_lat?: number
  check_in_lng?: number
  status: AttendanceStatus
  is_late: boolean
  overtime_hours: number
  notes?: string
}

export interface Payslip {
  id: number
  user_id: number
  full_name: string
  employee_id: string
  month: number
  year: number
  gross_salary: number
  lop_days: number
  lop_deduction: number
  net_salary: number
  file_path?: string
}

export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent'
export type AnnouncementCategory = 'general' | 'hr' | 'policy' | 'event' | 'it' | 'finance' | 'other'
export type AnnouncementAudience = 'all' | 'employees' | 'admins'

export interface Announcement {
  id: number
  title: string
  content: string
  is_active: boolean
  posted_by: number
  author?: string
  author_role?: string
  priority: AnnouncementPriority
  category: AnnouncementCategory
  pinned: boolean
  expires_at?: string | null
  target_audience: AnnouncementAudience
  deleted_at?: string | null
  read_count?: number
  is_read_by_me?: boolean | number
  created_at: string
  updated_at?: string
}

export interface PerformanceReview {
  id: number
  user_id: number
  full_name?: string
  employee_id?: string
  department?: string
  reviewed_by: number
  reviewer_name?: string
  period: string
  rating: number
  feedback?: string
  created_at: string
}

export type DocumentType =
  | 'aadhar' | 'pan' | 'offer_letter' | 'appointment_letter'
  | 'resume' | 'education_certificate' | 'experience_letter'
  | 'bank_details' | 'passport' | 'driving_license'
  | 'nda' | 'contract' | 'other'

export type DocumentVerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired'

export interface Document {
  id: number
  user_id: number
  owner_name?: string
  employee_id?: string
  document_type: DocumentType
  file_name: string
  file_path: string
  verification_status: DocumentVerificationStatus
  verified_by?: number
  verified_by_name?: string
  verified_at?: string
  hr_notes?: string
  expiry_date?: string
  uploaded_by: number
  created_at: string
}

export interface DashboardStats {
  totalEmployees: number
  totalAdmins: number
  presentToday: number
  onLeave: number
  pendingLeaves: number
  totalPayroll: number
}
