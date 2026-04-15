import { useState, useEffect } from 'react';
import { CalendarDays, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';

export default function LeaveApprovals() {
  const t = useTheme();
  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [tab, setTab]         = useState('pending');

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leaves/all');
      setLeaves(data);
    } catch { } finally { setLoading(false); }
  };

  const handleAction = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/status`, { status, review_remark: remarks[id] || '' });
      fetchLeaves();
    } catch { alert('Error updating leave'); }
  };

  const pending  = leaves.filter(l => l.status === 'pending');
  const approved = leaves.filter(l => l.status === 'approved');
  const rejected = leaves.filter(l => l.status === 'rejected');
  const shown    = tab === 'pending' ? pending : tab === 'approved' ? approved : rejected;

  const inputCls = `w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-3 py-2 text-sm focus:outline-none ${t.primaryRing} transition-all`;

  return (
    <PageWrapper title="Leave Approvals">
      <div className="space-y-6">

        <StatsRow stats={[
          { title: 'Pending',  value: pending.length,  icon: Clock,        iconBg: 'bg-amber-50',  iconColor: 'text-amber-500'  },
          { title: 'Approved', value: approved.length, icon: CheckCircle2, iconBg: 'bg-green-50',  iconColor: 'text-green-500'  },
          { title: 'Rejected', value: rejected.length, icon: XCircle,      iconBg: 'bg-red-50',    iconColor: 'text-red-500'    },
          { title: 'Total',    value: leaves.length,   icon: CalendarDays, iconBg: 'bg-blue-50',   iconColor: 'text-blue-500'   },
        ]} />

        <PanelCard icon={CalendarDays} title="Leave Requests" subtitle="Review and manage employee leave applications">

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
            {[
              { key: 'pending',  label: `Pending (${pending.length})`  },
              { key: 'approved', label: `Approved (${approved.length})` },
              { key: 'rejected', label: `Rejected (${rejected.length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? `${t.primary} text-white shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading...</div>
          ) : shown.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No {tab} leave requests</div>
          ) : tab === 'pending' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {shown.map((leave, i) => (
                <motion.div key={leave.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${t.iconBg} ${t.iconColor} flex items-center justify-center font-bold`}>
                        {leave.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{leave.full_name}</p>
                        <p className="text-xs font-mono text-gray-400">{leave.employee_id}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${leave.leave_type === 'casual' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                      {leave.leave_type === 'casual' ? 'Casual Leave' : 'LOP'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays size={14} className="text-gray-400" />
                    <span className="font-medium">{new Date(leave.from_date).toLocaleDateString()}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium">{new Date(leave.to_date).toLocaleDateString()}</span>
                    <span className="text-gray-400 text-xs">({leave.total_days} day{leave.total_days > 1 ? 's' : ''})</span>
                  </div>

                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600">
                    <span className="text-xs text-gray-400 block mb-1">Reason</span>
                    {leave.reason}
                  </div>

                  <input type="text" placeholder="Optional remark to employee..."
                    className={inputCls}
                    value={remarks[leave.id] || ''}
                    onChange={e => setRemarks({ ...remarks, [leave.id]: e.target.value })} />

                  <div className="flex gap-3">
                    <button onClick={() => handleAction(leave.id, 'approved')}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 py-2.5 rounded-xl transition-all text-sm font-medium">
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button onClick={() => handleAction(leave.id, 'rejected')}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-xl transition-all text-sm font-medium">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Employee', 'Type', 'Dates', 'Days', 'Status', 'Remark'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {shown.map(leave => (
                    <tr key={leave.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{leave.full_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{leave.employee_id}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${leave.leave_type === 'casual' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {leave.leave_type === 'casual' ? 'CL' : 'LOP'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                        {new Date(leave.from_date).toLocaleDateString()} – {new Date(leave.to_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-gray-600">{leave.total_days}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${leave.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs max-w-[180px] truncate">{leave.review_remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PanelCard>
      </div>
    </PageWrapper>
  );
}
