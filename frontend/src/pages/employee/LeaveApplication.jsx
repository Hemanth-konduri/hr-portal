import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import { ThemedButton, ThemedSelect, ThemedTextarea } from '../../components/shared/ThemedInputs';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5';

export default function LeaveApplication() {
  const t = useTheme();
  const [balance, setBalance] = useState({ casual_total: 1, casual_remaining: 1, lop_count: 0 });
  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ leave_type: 'casual', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [b, l] = await Promise.all([
        api.get('/leaves/balance').catch(() => ({ data: { casual_total: 1, casual_remaining: 1, lop_count: 0 } })),
        api.get('/leaves'),
      ]);
      setBalance(b.data);
      setLeaves(l.data);
    } catch { } finally { setLoading(false); }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leaves/apply', form);
      setForm({ leave_type: 'casual', from_date: '', to_date: '', reason: '' });
      fetchData();
    } catch (err) { alert(err.response?.data?.msg || 'Error applying for leave'); }
    finally { setSubmitting(false); }
  };

  return (
    <PageWrapper title="Leave Center">
      <div className="space-y-6">

        <StatsRow stats={[
          { title: 'Casual Leave Remaining', value: `${balance.casual_remaining}/${balance.casual_total}`, icon: Calendar,     iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
          { title: 'LOP Days',               value: balance.lop_count,                                     icon: AlertCircle,  iconBg: 'bg-red-50',    iconColor: 'text-red-500'    },
          { title: 'Total Applied',          value: leaves.length,                                          icon: Clock,        iconBg: 'bg-blue-50',   iconColor: 'text-blue-500'   },
          { title: 'Approved',               value: leaves.filter(l => l.status === 'approved').length,    icon: CheckCircle2, iconBg: 'bg-green-50',  iconColor: 'text-green-500'  },
        ]} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">

          {/* Apply form */}
          <PanelCard icon={Calendar} title="Apply for Leave" subtitle="Submit a leave request">
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className={labelCls}>Leave Type *</label>
                <select required value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })} className={inputCls}>
                  <option value="casual">Casual Leave (CL) — {balance.casual_remaining} remaining</option>
                  <option value="lop">Loss of Pay (LOP)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>From Date *</label>
                  <input required type="date" value={form.from_date} onChange={e => setForm({ ...form, from_date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>To Date *</label>
                  <input required type="date" value={form.to_date} onChange={e => setForm({ ...form, to_date: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Reason *</label>
                <textarea required rows={4} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="State the reason for your leave..." className={`${inputCls} resize-none`} />
              </div>
              <ThemedButton type="submit" disabled={submitting} className="w-full py-2.5">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </ThemedButton>
            </form>
          </PanelCard>

          {/* Leave history */}
          <PanelCard icon={Clock} title="Leave History" subtitle={`${leaves.length} total requests`}>
            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading...</div>
            ) : leaves.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No leave requests yet</div>
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                {leaves.map((l, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${l.leave_type === 'casual' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {l.leave_type === 'casual' ? 'Casual Leave' : 'LOP'}
                        </span>
                        <span className="text-xs text-gray-400">{l.total_days} day{l.total_days > 1 ? 's' : ''}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${l.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : l.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {l.status === 'approved' ? <CheckCircle2 size={12} /> : l.status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                        {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(l.from_date).toLocaleDateString('en-IN')} → {new Date(l.to_date).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-sm text-gray-400 line-clamp-2">{l.reason}</p>
                    {l.review_remark && (
                      <div className={`mt-3 p-3 rounded-xl ${t.primaryBg} border ${t.primaryBorder} text-xs text-gray-600`}>
                        <span className="font-semibold">HR Note: </span>{l.review_remark}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </PanelCard>
        </div>
      </div>
    </PageWrapper>
  );
}
