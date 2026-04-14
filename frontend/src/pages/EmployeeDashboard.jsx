import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      try {
        const [attRes, leaveRes, annRes] = await Promise.all([
          axios.get('http://localhost:5000/api/attendance', config),
          axios.get('http://localhost:5000/api/leaves', config),
          axios.get('http://localhost:5000/api/announcements', config),
        ]);

        setAttendance(attRes.data);
        setLeaves(leaveRes.data);
        setAnnouncements(annRes.data);

        const today = new Date();
        const todayKey = today.toISOString().split('T')[0];
        const todayRecord = attRes.data.find((item) => new Date(item.date).toISOString().split('T')[0] === todayKey);
        setTodayAttendance(todayRecord || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const pendingLeaves = useMemo(() => leaves.filter((item) => item.status === 'pending').length, [leaves]);
  const approvedLeaves = useMemo(() => leaves.filter((item) => item.status === 'approved').length, [leaves]);
  const lateCount = useMemo(() => attendance.filter((item) => item.status === 'late').length, [attendance]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCheckIn = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };

        try {
          await axios.post('http://localhost:5000/api/attendance/checkin', { latitude, longitude }, config);
          window.location.reload();
        } catch (err) {
          alert('Check-in failed');
        }
      });
    }
  };

  const handleCheckOut = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };

        try {
          await axios.post('http://localhost:5000/api/attendance/checkout', { latitude, longitude }, config);
          window.location.reload();
        } catch (err) {
          alert('Check-out failed');
        }
      });
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 text-slate-900 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Employee dashboard</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Welcome back, {user?.full_name || 'Employee'}</h1>
              <p className="max-w-2xl text-base text-slate-600">A modern, responsive employee dashboard for attendance, leave status, payslips, and company updates.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleCheckIn} className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700">Check In</button>
              <button onClick={handleCheckOut} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300">Check Out</button>
              <button onClick={handleLogout} className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">Logout</button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Attendance records</p>
              <p className="mt-5 text-3xl font-semibold text-slate-950">{attendance.length}</p>
              <p className="mt-3 text-sm text-slate-500">Logged attendance entries</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Pending leaves</p>
              <p className="mt-5 text-3xl font-semibold text-slate-950">{pendingLeaves}</p>
              <p className="mt-3 text-sm text-slate-500">Waiting for approval</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Approved leaves</p>
              <p className="mt-5 text-3xl font-semibold text-slate-950">{approvedLeaves}</p>
              <p className="mt-3 text-sm text-slate-500">Confirmed by HR</p>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Late marks</p>
              <p className="mt-5 text-3xl font-semibold text-slate-950">{lateCount}</p>
              <p className="mt-3 text-sm text-slate-500">Recorded late entries</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Today's Attendance</p>
                    <p className="mt-2 text-sm text-slate-500">Your current check-in / check-out status</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700">{todayAttendance?.status?.toUpperCase() || 'No record'}</span>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                    <p className="text-slate-500">Check In</p>
                    <p className="mt-3 text-xl font-semibold">{todayAttendance?.checkIn?.time ? new Date(todayAttendance.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                    <p className="text-slate-500">Check Out</p>
                    <p className="mt-3 text-xl font-semibold">{todayAttendance?.checkOut?.time ? new Date(todayAttendance.checkOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                    <p className="text-slate-500">Location</p>
                    <p className="mt-3 text-sm font-semibold">{todayAttendance?.checkIn?.location ? `${todayAttendance.checkIn.location.latitude.toFixed(2)}, ${todayAttendance.checkIn.location.longitude.toFixed(2)}` : 'Not available'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Daily Work Update</p>
                    <p className="mt-2 text-sm text-slate-500">Keep your manager aligned with progress.</p>
                  </div>
                  <span className="rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold text-sky-700">New</span>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"> <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">1</span> Added today's accomplishments</div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"> <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-600">2</span> Submitted tasks status</div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"> <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-bold text-slate-600">3</span> Shared notes with manager</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-2xl font-semibold text-slate-900">{user?.full_name?.slice(0, 1) || 'E'}</div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Employee profile</p>
                    <h2 className="text-2xl font-semibold text-slate-900">{user?.full_name || 'Your Name'}</h2>
                    <p className="text-sm text-slate-500">{user?.department || 'Department'} • {user?.position || 'Position'}</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                    <p className="text-slate-500">Total Leaves</p>
                    <p className="mt-3 text-xl font-semibold text-slate-900">{leaves.length}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 text-sm">
                    <p className="text-slate-500">Attendance Days</p>
                    <p className="mt-3 text-xl font-semibold text-slate-900">{attendance.length}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-lg font-semibold text-slate-900">Announcements</p>
                  <p className="mt-1 text-sm text-slate-500">Latest company updates</p>
                </div>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                  ) : announcements.length === 0 ? (
                    <p className="text-sm text-slate-500">No announcements available.</p>
                  ) : (
                    announcements.slice(0, 4).map((item) => (
                      <div key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <p className="text-lg font-semibold text-slate-900">Upcoming Calendar</p>
                  <p className="mt-1 text-sm text-slate-500">Events and holidays ahead</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="font-semibold text-slate-900">Apr 19</p>
                    <p className="text-sm text-slate-500">Team Sync</p>
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="font-semibold text-slate-900">Apr 24</p>
                    <p className="text-sm text-slate-500">Monthly Review</p>
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="font-semibold text-slate-900">Apr 30</p>
                    <p className="text-sm text-slate-500">Payroll Close</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmployeeDashboard;
