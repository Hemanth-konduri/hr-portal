import { useState, useEffect } from 'react';
import { IndianRupee, FileDown, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';

export default function Payslips() {
  const t = useTheme();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/payslips/my').then(r => setPayslips(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalNet   = payslips.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
  const totalGross = payslips.reduce((s, p) => s + parseFloat(p.gross_salary || 0), 0);
  const totalLOP   = payslips.reduce((s, p) => s + parseFloat(p.lop_deduction || 0), 0);

  const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <PageWrapper title="My Payslips">
      <div className="space-y-6">

        <StatsRow stats={[
          { title: 'Total Payslips',    value: payslips.length,                              icon: IndianRupee, iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
          { title: 'Total Earned',      value: `₹${totalNet.toLocaleString('en-IN')}`,       icon: TrendingUp,  iconBg: 'bg-green-50',  iconColor: 'text-green-500'  },
          { title: 'Total Gross',       value: `₹${totalGross.toLocaleString('en-IN')}`,     icon: IndianRupee, iconBg: 'bg-blue-50',   iconColor: 'text-blue-500'   },
          { title: 'Total LOP Deducted',value: `₹${totalLOP.toLocaleString('en-IN')}`,       icon: TrendingDown,iconBg: 'bg-red-50',    iconColor: 'text-red-500'    },
        ]} />

        <PanelCard icon={IndianRupee} title="Salary Archive" subtitle="All your monthly payslips">
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading payslips...</div>
          ) : payslips.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <IndianRupee size={40} className="mx-auto mb-3 text-gray-200" />
              <p>No payslips uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payslips.map((ps, i) => (
                <motion.div key={ps.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${t.iconBg} ${t.iconColor} flex flex-col items-center justify-center font-bold flex-shrink-0`}>
                      <span className="text-sm leading-none">{MONTHS[ps.month]}</span>
                      <span className="text-xs text-gray-400 mt-0.5">{ps.year}</span>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">₹{parseFloat(ps.net_salary).toLocaleString('en-IN')}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-green-600">Gross: ₹{parseFloat(ps.gross_salary).toLocaleString('en-IN')}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-red-500">LOP: -₹{parseFloat(ps.lop_deduction).toLocaleString('en-IN')} ({ps.lop_days} days)</span>
                      </div>
                    </div>
                  </div>
                  {ps.file_path ? (
                    <a href={`http://localhost:5000${ps.file_path}`} target="_blank" rel="noreferrer"
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white ${t.primary} ${t.primaryHover} transition-all flex-shrink-0`}>
                      <FileDown size={16} /> Download PDF
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 px-4 py-2.5">No PDF</span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </PageWrapper>
  );
}
