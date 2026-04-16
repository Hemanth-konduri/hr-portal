import { useState, useEffect } from 'react';
import { DollarSign, Upload, FileText, FileDown, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import StatsRow from '../../components/shared/StatsRow';
import { ThemedButton, ThemedSelect } from '../../components/shared/ThemedInputs';
import { useTheme } from '../../hooks/useTheme';
import api from '../../api/axios';

const inputCls = 'w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5';

export default function PayrollManagement() {
  const t = useTheme();
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips]   = useState([]);
  const [loading, setLoading]     = useState(true);

  const [upload, setUpload] = useState({ user_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), file: null });
  const [structure, setStructure] = useState({ user_id: '', basic: '', hra: '', allowances: '', effective_from: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([api.get('/users'), api.get('/payslips/all').catch(() => ({ data: [] }))]);
      setEmployees(e.data.filter(u => u.role === 'employee'));
      setPayslips(p.data);
    } catch { } finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!upload.file || !upload.user_id) return alert('Select employee and file');
    const fd = new FormData();
    Object.entries(upload).forEach(([k, v]) => k !== 'file' && fd.append(k, v));
    fd.append('payslip', upload.file);
    try {
      await api.post('/payslips/generate', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUpload({ ...upload, file: null });
      fetchData();
    } catch (err) { alert(err.response?.data?.msg || 'Upload failed'); }
  };

  const handleStructure = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payslips/structure', structure);
      setStructure({ user_id: '', basic: '', hra: '', allowances: '', effective_from: '' });
      alert('Salary structure saved');
    } catch (err) { alert(err.response?.data?.msg || 'Error'); }
  };

  const totalPayroll = payslips.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0);
  const totalLOP     = payslips.reduce((s, p) => s + parseFloat(p.lop_deduction || 0), 0);

  return (
    <PageWrapper title="Payroll Center">
      <div className="space-y-6">

        <StatsRow stats={[
          { title: 'Total Employees', value: employees.length,                                    icon: DollarSign, iconBg: 'bg-blue-50',   iconColor: 'text-blue-500'  },
          { title: 'Payslips Issued', value: payslips.length,                                     icon: FileText,   iconBg: 'bg-green-50',  iconColor: 'text-green-500' },
          { title: 'Total Payroll',   value: `₹${totalPayroll.toLocaleString('en-IN')}`,          icon: IndianRupee,iconBg: 'bg-amber-50',  iconColor: 'text-amber-500' },
          { title: 'Total LOP Deducted', value: `₹${totalLOP.toLocaleString('en-IN')}`,          icon: FileDown,   iconBg: 'bg-red-50',    iconColor: 'text-red-500'   },
        ]} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Upload Payslip */}
          <PanelCard icon={Upload} title="Upload Monthly Payslip" subtitle="Upload PDF payslip for an employee">
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className={labelCls}>Employee *</label>
                <select required value={upload.user_id} onChange={e => setUpload({ ...upload, user_id: e.target.value })} className={inputCls}>
                  <option value="">Select Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Month</label>
                  <input type="number" min="1" max="12" required value={upload.month}
                    onChange={e => setUpload({ ...upload, month: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Year</label>
                  <input type="number" min="2020" required value={upload.year}
                    onChange={e => setUpload({ ...upload, year: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>PDF File *</label>
                <label htmlFor="pdf-upload"
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all">
                  <FileText size={28} className="text-gray-400" />
                  <span className="text-sm text-gray-500">{upload.file ? upload.file.name : 'Click to select PDF'}</span>
                  <input id="pdf-upload" type="file" accept="application/pdf" className="hidden"
                    onChange={e => setUpload({ ...upload, file: e.target.files[0] })} />
                </label>
              </div>
              <ThemedButton type="submit" className="w-full py-2.5">Upload & Save</ThemedButton>
            </form>
          </PanelCard>

          {/* Salary Structure */}
          <PanelCard icon={IndianRupee} title="Set Salary Structure" subtitle="Define basic, HRA and allowances per employee">
            <form onSubmit={handleStructure} className="space-y-4">
              <div>
                <label className={labelCls}>Employee *</label>
                <select required value={structure.user_id} onChange={e => setStructure({ ...structure, user_id: e.target.value })} className={inputCls}>
                  <option value="">Select Employee...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Basic Salary (₹)</label>
                  <input type="number" required value={structure.basic} placeholder="e.g. 30000"
                    onChange={e => setStructure({ ...structure, basic: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>HRA (₹)</label>
                  <input type="number" required value={structure.hra} placeholder="e.g. 10000"
                    onChange={e => setStructure({ ...structure, hra: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Allowances (₹)</label>
                  <input type="number" required value={structure.allowances} placeholder="e.g. 5000"
                    onChange={e => setStructure({ ...structure, allowances: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Effective From</label>
                  <input type="date" required value={structure.effective_from}
                    onChange={e => setStructure({ ...structure, effective_from: e.target.value })} className={inputCls} />
                </div>
              </div>
              <ThemedButton type="submit" className="w-full py-2.5">Save Structure</ThemedButton>
            </form>
          </PanelCard>
        </div>

        {/* Payslip Archive */}
        <PanelCard icon={FileText} title="Payslip Archive" subtitle={`${payslips.length} payslips issued`}>
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading...</div>
          ) : payslips.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No payslips generated yet</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Employee', 'Period', 'Gross', 'LOP Days', 'LOP Deduction', 'Net Salary', 'Download'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {payslips.map(ps => (
                    <tr key={ps.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-800">{ps.full_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{ps.employee_id}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{ps.month}/{ps.year}</td>
                      <td className="px-5 py-4 text-gray-700 font-medium">₹{parseFloat(ps.gross_salary).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-gray-600">{ps.lop_days}</td>
                      <td className="px-5 py-4 text-red-500 font-medium">-₹{parseFloat(ps.lop_deduction).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-green-600 font-bold">₹{parseFloat(ps.net_salary).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4">
                        {ps.file_path ? (
                          <a href={`http://localhost:5000${ps.file_path}`} target="_blank" rel="noreferrer"
                            className={`flex items-center gap-1.5 text-xs font-medium ${t.primaryText} hover:underline`}>
                            <FileDown size={14} /> PDF
                          </a>
                        ) : <span className="text-gray-400 text-xs">—</span>}
                      </td>
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
