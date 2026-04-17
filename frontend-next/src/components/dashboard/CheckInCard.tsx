'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import api from '@/lib/api/axios'
import {
  LogIn, LogOut, MapPin, Clock, UserCheck,
  AlertTriangle, Loader2, Navigation,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { attendanceDateKey } from '@/lib/attendance-dates'
import { AttendanceRecord, AttendanceStatus } from '@/types'

interface TodayStatus {
  checked_in: boolean
  checked_out: boolean
  check_in_time?: string
  check_out_time?: string
  check_in_lat?: number
  check_in_lng?: number
  is_late?: boolean
  status?: AttendanceStatus
  notes?: string
}

interface Props {
  onRefresh: () => void
}

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  absent:   'bg-red-50 text-red-600 border-red-200',
  half_day: 'bg-amber-50 text-amber-700 border-amber-200',
  lop:      'bg-orange-50 text-orange-700 border-orange-200',
  holiday:  'bg-blue-50 text-blue-700 border-blue-200',
  weekend:  'bg-gray-100 text-gray-500 border-gray-200',
}

export function CheckInCard({ onRefresh }: Props) {
  const [today,       setToday]       = useState<TodayStatus>({ checked_in: false, checked_out: false })
  const [fetching,    setFetching]    = useState(true)   // initial load
  const [loading,     setLoading]     = useState(false)  // action loading
  const [locating,    setLocating]    = useState(false)
  const [locError,    setLocError]    = useState<string | null>(null)

  // Always use fresh date inside fetch
  const fetchToday = useCallback(async () => {
    try {
      const now   = new Date()
      const month = String(now.getMonth() + 1)
      const year  = String(now.getFullYear())
      const { data } = await api.get('/attendance/my', { params: { month, year } })
      const todayStr = format(now, 'yyyy-MM-dd')
      const rec = (data as AttendanceRecord[]).find(r => attendanceDateKey(r.date) === todayStr)
      if (rec) {
        setToday({
          checked_in:     true,
          checked_out:    !!rec.check_out_time,
          check_in_time:  rec.check_in_time,
          check_out_time: rec.check_out_time,
          check_in_lat:   rec.check_in_lat,
          check_in_lng:   rec.check_in_lng,
          is_late:        rec.is_late,
          status:         rec.status,
          notes:          rec.notes,
        })
      } else {
        setToday({ checked_in: false, checked_out: false })
      }
    } catch {
      setToday({ checked_in: false, checked_out: false })
    } finally {
      setFetching(false)
    }
  }, [])

  useEffect(() => { fetchToday() }, [fetchToday])

  // GPS + reverse geocode
  const getLocation = (): Promise<{ lat: number; lng: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported by your browser'))
        return
      }
      setLocating(true)
      setLocError(null)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          let address = ''
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
              { headers: { 'Accept-Language': 'en' } }
            )
            const data = await res.json()
            const a = data.address || {}
            const parts = [
              a.amenity || a.building || a.tourism || a.leisure || a.shop || a.office || '',
              a.road || a.pedestrian || a.footway || '',
              a.suburb || a.neighbourhood || a.quarter || '',
              a.city || a.town || a.village || a.county || '',
              a.state || '',
            ].filter(Boolean)
            address = parts.length > 0
              ? parts.join(', ')
              : (data.display_name?.split(',').slice(0, 4).join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
          } catch {
            address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          }
          setLocating(false)
          resolve({ lat, lng, address })
        },
        (err) => {
          setLocating(false)
          const msg =
            err.code === 1 ? 'Location access denied. Please allow location in browser settings.' :
            err.code === 2 ? 'Location unavailable. Check your GPS/network.' :
            'Location request timed out.'
          reject(new Error(msg))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }

  const handleCheckIn = async () => {
    setLoading(true)
    setLocError(null)
    try {
      const loc = await getLocation()
      const res = await api.post('/attendance/checkin', {
        latitude:      loc.lat,
        longitude:     loc.lng,
        location_name: loc.address,
        client_time:   new Date().toISOString(),
      })
      setToday({
        checked_in:    true,
        checked_out:   false,
        check_in_time: new Date().toISOString(),
        is_late:       res.data.isLate,
        status:        res.data.status,
        check_in_lat:  loc.lat,
        check_in_lng:  loc.lng,
        notes:         loc.address,
      })
      toast.success(res.data.isLate
        ? 'Checked in — marked as Late. Half day LOP applied.'
        : 'Checked in successfully! Have a great day 🎉'
      )
      onRefresh()
    } catch (err: any) {
      const serverMsg: string = err.response?.data?.msg || ''
      if (serverMsg === 'Already checked in today') {
        // Pull existing record from DB and show checkout button
        await fetchToday()
        toast.info('Already checked in. Use the Check Out button when done.')
      } else {
        setLocError(serverMsg || err.message || 'Check-in failed')
        toast.error(serverMsg || err.message || 'Check-in failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setLoading(true)
    setLocError(null)
    try {
      const loc = await getLocation()
      const res = await api.post('/attendance/checkout', {
        latitude:      loc.lat,
        longitude:     loc.lng,
        location_name: loc.address,
      })
      setToday(prev => ({
        ...prev,
        checked_out:    true,
        check_out_time: new Date().toISOString(),
      }))
      toast.success(res.data.overtimeHours > 0
        ? `Checked out! ${res.data.overtimeHours}h overtime logged 💪`
        : 'Checked out successfully! See you tomorrow 👋'
      )
      onRefresh()
    } catch (err: any) {
      const msg = err.response?.data?.msg || err.message || 'Check-out failed'
      setLocError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const mapsUrl = today.check_in_lat && today.check_in_lng
    ? `https://www.google.com/maps?q=${today.check_in_lat},${today.check_in_lng}`
    : null

  const borderClass =
    !today.checked_in  ? 'border-dashed border-border' :
    today.checked_out  ? 'border-emerald-200 bg-emerald-50/20' :
                         'border-amber-200 bg-amber-50/10'

  const now = new Date()

  // Show skeleton only on initial load
  if (fetching) {
    return <Skeleton className="h-24 w-full rounded-xl" />
  }

  return (
    <Card className={cn('border-2 transition-all', borderClass)}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          {/* Left info */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                {format(now, 'EEEE, d MMMM yyyy')}
              </p>
            </div>

            {/* Status + late badges */}
            <div className="flex flex-wrap items-center gap-2">
              {today.status && (
                <Badge variant="outline" className={cn('text-[10px] capitalize', STATUS_STYLES[today.status])}>
                  {today.status.replace('_', ' ')}
                </Badge>
              )}
              {today.is_late && (
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 gap-1">
                  <AlertTriangle size={9} /> Late arrival
                </Badge>
              )}
            </div>

            {/* Check-in / Check-out times */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {today.check_in_time && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>In:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {format(new Date(today.check_in_time), 'HH:mm')}
                  </span>
                </div>
              )}
              {today.check_out_time && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-400" />
                  <span>Out:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {format(new Date(today.check_out_time), 'HH:mm')}
                  </span>
                </div>
              )}
              {!today.checked_in && !locating && (
                <span className="text-muted-foreground/60 italic">Not checked in yet</span>
              )}
            </div>

            {/* Location name */}
            {today.check_in_lat && (
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <MapPin size={11} className="mt-0.5 shrink-0 text-blue-500" />
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="text-foreground font-medium">
                    {today.notes || `${Number(today.check_in_lat).toFixed(5)}, ${Number(today.check_in_lng).toFixed(5)}`}
                  </span>
                  {mapsUrl && (
                    <a href={mapsUrl} target="_blank" rel="noreferrer"
                      className="text-blue-500 hover:underline font-medium shrink-0">
                      View on map ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Locating indicator */}
            {locating && (
              <p className="text-[11px] text-blue-500 flex items-center gap-1.5">
                <Navigation size={11} className="animate-pulse" />
                Getting your location...
              </p>
            )}

            {/* Error */}
            {locError && (
              <p className="text-[11px] text-red-500 flex items-center gap-1">
                <AlertTriangle size={11} /> {locError}
              </p>
            )}
          </div>

          {/* Right: action button */}
          <div className="flex items-center gap-3 shrink-0">
            {!today.checked_in && (
              <Button
                onClick={handleCheckIn}
                disabled={loading}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[130px]"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                {loading ? 'Checking in...' : 'Check In'}
              </Button>
            )}

            {today.checked_in && !today.checked_out && (
              <Button
                onClick={handleCheckOut}
                disabled={loading}
                variant="outline"
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 min-w-[130px]"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                {loading ? 'Checking out...' : 'Check Out'}
              </Button>
            )}

            {today.checked_in && today.checked_out && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                <UserCheck size={16} />
                Attendance complete
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
