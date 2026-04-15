import { useEffect, useState } from 'react';
import { Clock, Calendar, CheckCircle2, AlertCircle, FileText, Megaphone, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import { ThemedButton, ThemedTextarea } from '../../components/shared/ThemedInputs';
import api from '../../api/axios';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const t = useTheme();

  const [attendance, setAttendance]       = useState([]);
  const [leaves, setLeaves]               = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [todayRecord, setTodayRecord]     = useState(null);
  const [workUpdate, setWorkUpdate]       = useState('');
  const [loading, setLoading]             = useState(true);
  const [checkingIn, setCheckingIn]       = useState(false);
  const [checkingOut, setCheckingOut]     = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/attendance/my').catch(() => ({ data: [] })),
      api.get('/leaves').catch(() => ({ data: [] })),
      api.get('/announcements').catch(() => ({ data: [] })),
    ]).then(([a, l, ann]) => {
      setAttendance(a.data);
      setLeaves(l.data);
      setAnnouncements(ann.data);
      const today = new Date().toISOString().split('T')[0];
      setTodayRecord(a.data.find(r => r.date?.startsWith(today)) || null);
    }).finally(() => setLoading(false));
  }, []);

  const getLocation = () => new Promise((res, rej) =>
    navigator.geolocation.getCurrentPosition(p => res({ lat: p.coords.latitude, lng: p.coords.longitude }), rej)
  );

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const { lat, lng } = await getLocation();
      await api.post('/attendance/checkin', { latitude: lat, longitude: lng });
      window.location.reload();
    } catch (err) { alert(err.response?.data?.msg || 'Check-in failed. Allow location access.'); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const { lat, lng } = await getLocation();
      await api.post('/attendance/checkout', { latitude: lat, longitude: lng });
      window.location.reload();
    } catch (err) { alert(err.response?.data?.msg || 'Check-out failed.'); }
    finally { setCheckingOut(false); }
  };

  const handleWorkUpdate = async () => {
    if (!workUpdate.trim()) return;
    try {
      await api.post('/work-updates', { update_text: workUpdate });
      setWorkUpdate('');
      alert('Work update submitted!');
    } catch { alert('Error submitting update'); }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const lateCount     = attendance.filter(a => a.is_late).length;

  return (
    <PageWrapper title="My Dashboard">
      <div className="space-y-6">

        {/* Welcome banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 ${t.primaryBg} border ${t.primaryBorder} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]} 👋</h2>
            <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCheckIn} disabled={checkingIn || !!todayRecord?.check_in_time}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${t.primary} ${t.primaryHover} disabled:opacity-50`}>
              {checkingIn ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
              Check In
            </button>
            <button onClick={handleCheckOut} disabled={checkingOut || !todayRecord?.check_in_time || !!todayRecord?.check_out_time}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-gray-700 text-sm font-semibold bg-white border border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50">
              {checkingOut ? <Loader2 size={15} className="animate-spin" /> : <Clock size={15} />}
              Check Out
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <StatsRow stats={[
          { title: 'Days Present',    value: attendance.filter(a => a.status === 'present').length, icon: CheckCircle2, iconBg: 'bg-green-50',  iconColor: 'text-green-500'  },
          { title: 'Pending Leaves',  value: pendingLeaves,                                          icon: AlertCircle,  iconBg: 'bg-amber-50',  iconColor: 'text-amber-500'  },
          { title: 'Late Marks',      value: lateCount,                                              icon: Clock,        iconBg: 'bg-red-50',    iconColor: 'text-red-500'    },
          { title: 'Total Leaves',    value: leaves.length,                                          icon: Calendar,     iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
        ]} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">

            {/* Today's attendance */}
            <PanelCard icon={Clock} title="Today's Attendance" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Check In</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todayRecord?.check_in_time ? new Date(todayRecord.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </p>
                  {todayRecord?.is_late && <span className="text-xs text-amber-600 font-medium mt-1 block">⚠ Late arrival</span>}
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Check Out</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {todayRecord?.check_out_time ? new Date(todayRecord.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </p>
                </div>
                {todayRecord?.check_in_lat && (
                  <div className="col-span-2 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} className="text-gray-400" />
                    {parseFloat(todayRecord.check_in_lat).toFixed(5)}, {parseFloat(todayRecord.check_in_lng).toFixed(5)}
                  </div>
                )}
              </div>
            </PanelCard>

            {/* Recent leave history */}
            <PanelCard icon={Calendar} title="Recent Leave Requests">
              {leaves.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No leave requests yet</p>
              ) : (
                <div className="space-y-3">
                  {leaves.slice(0, 4).map((l, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{l.leave_type === 'casual' ? 'Casual Leave' : 'LOP'}</p>
                        <p className="text-xs text-gray-400">{new Date(l.from_date).toLocaleDateString()} – {new Date(l.to_date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${l.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : l.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </PanelCard>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Daily work update */}
            <PanelCard icon={FileText} title="Daily Work Update" subtitle="Submit before logging off">
              <div className="space-y-3">
                <ThemedTextarea rows={4} value={workUpdate} onChange={e => setWorkUpdate(e.target.value)}
                  placeholder="What did you accomplish today?" />
                <ThemedButton onClick={handleWorkUpdate} className="w-full py-2.5">Submit Update</ThemedButton>
              </div>
            </PanelCard>

            {/* Announcements */}
            <PanelCard icon={Megaphone} title="Announcements">
              {loading ? (
                <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
              ) : announcements.filter(a => a.is_active).length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No announcements</p>
              ) : (
                <div className="space-y-3">
                  {announcements.filter(a => a.is_active).slice(0, 4).map((a, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.content}</p>
                      <p className="text-xs text-gray-300 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </PanelCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
