import { useEffect, useState } from 'react';
import { Users, Clock, CalendarDays, AlertCircle, TrendingUp, CheckCircle2, UserCog, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import api from '../../api/axios';

export default function AdminDashboard() {
  const { user } = useAuth();
  const t = useTheme();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';

  const [users, setUsers]               = useState([]);
  const [leaves, setLeaves]             = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/leaves/all').catch(() => ({ data: [] })),
      api.get('/announcements').catch(() => ({ data: [] })),
    ]).then(([u, l, a]) => {
      setUsers(u.data);
      setLeaves(l.data);
      setAnnouncements(a.data);
    }).finally(() => setLoading(false));
  }, []);

  const employees    = users.filter(u => u.role === 'employee');
  const admins       = users.filter(u => u.role === 'admin');
  const present      = employees.filter(e => e.status === 'active').length;
  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

  const stats = [
    { title: 'Total Employees', value: employees.length, icon: Users,        iconBg: 'bg-blue-50',   iconColor: 'text-blue-500'  },
    { title: 'Active Staff',    value: present,           icon: CheckCircle2, iconBg: 'bg-green-50',  iconColor: 'text-green-500' },
    { title: 'Pending Leaves',  value: pendingLeaves,     icon: CalendarDays, iconBg: 'bg-amber-50',  iconColor: 'text-amber-500' },
    ...(isSuperAdmin
      ? [{ title: 'Total Admins', value: admins.length, icon: UserCog, iconBg: 'bg-purple-50', iconColor: 'text-purple-500' }]
      : [{ title: 'Announcements', value: announcements.length, icon: Megaphone, iconBg: 'bg-rose-50', iconColor: 'text-rose-500' }]
    ),
  ];

  const basePath = isSuperAdmin ? '/admin' : '/admin';

  const quickActions = [
    { label: 'Manage Employees', icon: Users,        path: '/admin/employees',     bg: 'bg-blue-50',   color: 'text-blue-600'   },
    { label: 'Leave Approvals',  icon: CalendarDays, path: '/admin/leaves',        bg: 'bg-amber-50',  color: 'text-amber-600'  },
    { label: 'Payroll',          icon: Clock,        path: '/admin/payroll',       bg: 'bg-green-50',  color: 'text-green-600'  },
    { label: 'Announcements',    icon: Megaphone,    path: '/admin/announcements', bg: 'bg-rose-50',   color: 'text-rose-600'   },
    ...(isSuperAdmin ? [{ label: 'Manage Admins', icon: UserCog, path: '/super-admin/admins', bg: 'bg-purple-50', color: 'text-purple-600' }] : []),
  ];

  return (
    <PageWrapper title={isSuperAdmin ? 'Super Admin Dashboard' : 'Admin Dashboard'}>
      <div className="space-y-6">

        {/* Stats */}
        <StatsRow stats={stats} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">

            {/* Attendance trend chart */}
            <PanelCard icon={TrendingUp} title="Attendance Overview" subtitle="Weekly check-in trend">
              <div className="flex items-end justify-between gap-2 h-36 px-2">
                {[
                  { day: 'Mon', val: 85 }, { day: 'Tue', val: 92 }, { day: 'Wed', val: 78 },
                  { day: 'Thu', val: 95 }, { day: 'Fri', val: 70 }, { day: 'Sat', val: 40 },
                ].map(({ day, val }, i) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{val}%</span>
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: `${val}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6 }}
                      className={`w-full rounded-t-lg ${t.bar} opacity-80`}
                      style={{ minHeight: 4 }}
                    />
                    <span className="text-xs text-gray-400">{day}</span>
                  </div>
                ))}
              </div>
            </PanelCard>

            {/* Recent leave requests */}
            <PanelCard icon={CalendarDays} title="Recent Leave Requests" subtitle="Latest pending approvals"
              action={<button onClick={() => navigate('/admin/leaves')} className={`text-xs font-semibold ${t.primaryText}`}>View All</button>}>
              {loading ? (
                <p className="text-sm text-gray-400 py-4 text-center">Loading...</p>
              ) : leaves.filter(l => l.status === 'pending').length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No pending leave requests</p>
              ) : (
                <div className="space-y-3">
                  {leaves.filter(l => l.status === 'pending').slice(0, 4).map((l, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${t.iconBg} ${t.iconColor} flex items-center justify-center text-xs font-bold`}>
                          {l.full_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{l.full_name}</p>
                          <p className="text-xs text-gray-400">{l.leave_type === 'casual' ? 'Casual Leave' : 'LOP'} · {l.total_days} day(s)</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">Pending</span>
                    </div>
                  ))}
                </div>
              )}
            </PanelCard>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Quick actions */}
            <PanelCard icon={AlertCircle} title="Quick Actions">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(({ label, icon: Icon, path, bg, color }) => (
                  <button key={label} onClick={() => navigate(path)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl ${bg} border border-gray-100 hover:shadow-sm transition-all group`}>
                    <Icon size={22} className={`${color} group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-medium text-gray-600 text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </PanelCard>

            {/* Recent announcements */}
            <PanelCard icon={Megaphone} title="Announcements"
              action={<button onClick={() => navigate('/admin/announcements')} className={`text-xs font-semibold ${t.primaryText}`}>View All</button>}>
              {announcements.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No announcements yet</p>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 3).map((a, i) => (
                    <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(a.created_at).toLocaleDateString()}</p>
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
