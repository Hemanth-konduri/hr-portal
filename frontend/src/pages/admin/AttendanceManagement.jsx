import { useEffect, useState } from 'react';
import { Clock, MapPin, CheckCircle2, XCircle, AlertTriangle, Download, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';

const STATUS_STYLES = {
  present:  'bg-green-50 text-green-700 border-green-200',
  absent:   'bg-red-50 text-red-600 border-red-200',
  half_day: 'bg-amber-50 text-amber-700 border-amber-200',
  lop:      'bg-rose-50 text-rose-700 border-rose-200',
  holiday:  'bg-blue-50 text-blue-700 border-blue-200',
  weekend:  'bg-gray-100 text-gray-500 border-gray-200',
};

export default function AttendanceManagement() {
  const t = useTheme();
  const [records, setRecords]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterEmp, setFilterEmp] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/attendance/all').catch(() => ({ data: [] })),
      api.get('/users').catch(() => ({ data: [] })),
    ]).then(([a, u]) => {
      setRecords(a.data);
      setEmployees(u.data.filter(u => u.role === 'employee'));
    }).finally(() => setLoading(false));
  }, []);

  const filtered = records.filter(r => {
    const matchEmp    = !filterEmp    || String(r.user_id) === filterEmp;
    const matchDate   = !filterDate   || r.date?.startsWith(filterDate);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchEmp && matchDate && matchStatus;
  });

  const present  = records.filter(r => r.status === 'present').length;
  const absent   = records.filter(r => r.status === 'absent').length;
  const halfDay  = records.filter(r => r.status === 'half_day').length;
  const lop      = records.filter(r => r.status === 'lop').length;

  const inputCls = `bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-3 py-2 text-sm focus:outline-none ${t.primaryRing} transition-all`;

  return (
    <PageWrapper title="Attendance Management">
      <div className="space-y-6">

        <StatsRow stats={[
          { title: 'Present',  value: present,  icon: CheckCircle2,  iconBg: 'bg-green-50',  iconColor: 'text-green-500'  },
          { title: 'Absent',   value: absent,   icon: XCircle,       iconBg: 'bg-red-50',    iconColor: 'text-red-500'    },
          { title: 'Half Day', value: halfDay,  icon: AlertTriangle, iconBg: 'bg-amber-50',  iconColor: 'text-amber-500'  },
          { title: 'LOP',      value: lop,      icon: Clock,         iconBg: 'bg-rose-50',   iconColor: 'text-rose-500'   },
        ]} />

        <PanelCard icon={Clock} title="Attendance Records" subtitle="Filter and view all employee attendance">

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} className={inputCls}>
              <option value="">All Employees</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
            </select>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className={inputCls} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
              <option value="">All Statuses</option>
              {['present','absent','half_day','lop','holiday','weekend'].map(s => (
                <option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
            {(filterEmp || filterDate || filterStatus) && (
              <button onClick={() => { setFilterEmp(''); setFilterDate(''); setFilterStatus(''); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl bg-gray-50 transition-all">
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading records...</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Employee', 'Date', 'Check In', 'Check Out', 'Location', 'Status', 'Late', 'Overtime'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No records found</td></tr>
                  ) : filtered.map((r, i) => (
                    <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full ${t.iconBg} ${t.iconColor} flex items-center justify-center text-xs font-bold`}>
                            {r.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-xs">{r.full_name}</p>
                            <p className="text-gray-400 text-xs font-mono">{r.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td className="px-4 py-3">
                        {r.check_in_lat ? (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={12} className="text-gray-400" />
                            {parseFloat(r.check_in_lat).toFixed(3)}, {parseFloat(r.check_in_lng).toFixed(3)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[r.status] || STATUS_STYLES.absent}`}>
                          {r.status?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.is_late ? <span className="text-xs text-amber-600 font-medium">Late</span> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{r.overtime_hours > 0 ? `${r.overtime_hours}h` : '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">{filtered.length} of {records.length} records</p>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white ${t.primary} ${t.primaryHover} transition-all`}>
              <Download size={15} /> Export CSV
            </button>
          </div>
        </PanelCard>
      </div>
    </PageWrapper>
  );
}
