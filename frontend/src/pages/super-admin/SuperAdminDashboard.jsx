import { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, CheckCircle2, Megaphone, ShieldCheck, Users, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import UsersTable from '../../components/shared/UsersTable';
import DashboardIntro from '../../components/dashboard/DashboardIntro';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const t = useTheme();
  const [users, setUsers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/leaves/all').catch(() => ({ data: [] })),
      api.get('/announcements').catch(() => ({ data: [] })),
    ])
      .then(([usersRes, leavesRes, announcementsRes]) => {
        setUsers(usersRes.data);
        setLeaves(leavesRes.data);
        setAnnouncements(announcementsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const employees = users.filter((item) => item.role === 'employee');
  const admins = users.filter((item) => item.role === 'admin');
  const activeEmployees = employees.filter((item) => item.status === 'active').length;
  const pendingLeaves = leaves.filter((item) => item.status === 'pending').length;

  const stats = [
    { title: 'Total Employees', value: employees.length, icon: Users, iconBg: 'bg-sky-50', iconColor: 'text-sky-500' },
    { title: 'Active Staff', value: activeEmployees, icon: CheckCircle2, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { title: 'Pending Leaves', value: pendingLeaves, icon: CalendarDays, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
    { title: 'Total Admins', value: admins.length, icon: ShieldCheck, iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
  ];

  const attendanceTrend = [
    { day: 'Mon', value: 82 },
    { day: 'Tue', value: 90 },
    { day: 'Wed', value: 76 },
    { day: 'Thu', value: 88 },
    { day: 'Fri', value: 72 },
    { day: 'Sat', value: 58 },
  ];

  const recentRequests = leaves.filter((leave) => leave.status === 'pending').slice(0, 4);
  const recentEmployees = employees.slice(0, 8);

  const quickActions = [
    { label: 'Manage Admins', icon: ShieldCheck, path: '/super-admin/admins' },
    { label: 'Employees', icon: Users, path: '/admin/employees' },
    { label: 'Leave Approvals', icon: CalendarDays, path: '/admin/leaves' },
    { label: 'Payroll', icon: UserCog, path: '/admin/payroll' },
    { label: 'Announcements', icon: Megaphone, path: '/admin/announcements' },
  ];

  return (
    <PageWrapper title="Super Admin Dashboard">
      <div className="space-y-8">
        <DashboardIntro userName={user?.full_name || 'Administrator'} />

        <StatsRow stats={stats} />

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
          <div className="space-y-6">
            <PanelCard title="Attendance Trend" subtitle="Weekly check-ins across the workforce" icon={CalendarDays}>
              <div className="space-y-6">
                <div className="grid grid-cols-6 gap-3 h-48 items-end">
                  {attendanceTrend.map((item) => (
                    <div key={item.day} className="flex flex-col items-center gap-2">
                      <div className="flex h-full w-full items-end justify-center rounded-3xl bg-slate-100 pb-1">
                        <div className="w-full rounded-t-3xl bg-sky-500 transition-all" style={{ height: `${item.value}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{item.day}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Average attendance rate</span>
                  <span className="font-semibold text-gray-900">84.3%</span>
                </div>
              </div>
            </PanelCard>

            <PanelCard
              title="HR Overlook"
              subtitle="Staffing, approvals and admin coverage at a glance"
              icon={AlertTriangle}
              action={`${announcements.length} updates`}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Open leave requests</p>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{pendingLeaves}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Total employees</p>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{employees.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Active employees</p>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{activeEmployees}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
                  <p className="text-sm font-medium text-gray-500">Admins on duty</p>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{admins.length}</p>
                </div>
              </div>
            </PanelCard>

            <PanelCard
              title="Pending Leave Requests"
              subtitle="Review the latest approvals"
              icon={CalendarDays}
              action={<button onClick={() => navigate('/admin/leaves')} className={`text-xs font-semibold ${t.primaryText}`}>View all</button>}
            >
              {loading ? (
                <p className="text-sm text-gray-500 py-4">Loading requests...</p>
              ) : recentRequests.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No pending leave requests at the moment.</p>
              ) : (
                <div className="space-y-3">
                  {recentRequests.map((leave, index) => (
                    <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{leave.full_name}</p>
                          <p className="text-sm text-gray-500">{leave.leave_type?.charAt(0).toUpperCase() + leave.leave_type?.slice(1) || 'Leave'} • {leave.total_days} day(s)</p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PanelCard>
          </div>

          <div className="space-y-6">
            <PanelCard title="Employee Snapshot" subtitle="Quick employee table preview" icon={Users}>
              <UsersTable users={recentEmployees} onEdit={() => {}} onToggleStatus={() => {}} onSuspend={() => {}} />
            </PanelCard>

            <PanelCard title="Quick Actions" subtitle="Jump to the most important HR tools" icon={UserCog}>
              <div className="grid gap-3">
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </PanelCard>

            <PanelCard title="Super Admin Oversight" subtitle="Your most recent HR actions" icon={ShieldCheck}>
              <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Admins managed</p>
                  <p className="text-sm font-semibold text-gray-900">{admins.length}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Announcements live</p>
                  <p className="text-sm font-semibold text-gray-900">{announcements.length}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Open approvals</p>
                  <p className="text-sm font-semibold text-gray-900">{pendingLeaves}</p>
                </div>
              </div>
            </PanelCard>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SuperAdminDashboard;
