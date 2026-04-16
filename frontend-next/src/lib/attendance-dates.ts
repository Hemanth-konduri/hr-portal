import { format } from 'date-fns'

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

export function attendanceDateKey(value?: string | null) {
  if (!value) return ''
  if (DATE_ONLY_RE.test(value)) return value

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10)

  return format(parsed, 'yyyy-MM-dd')
}

export function attendanceDisplayDate(value?: string | null) {
  const key = attendanceDateKey(value)
  return key ? new Date(`${key}T00:00:00`) : null
}
