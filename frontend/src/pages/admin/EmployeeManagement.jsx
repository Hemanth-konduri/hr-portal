import { useState } from 'react';
import { Users, UserPlus, Link2, Briefcase, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import UserFormModal from '../../components/shared/UserFormModal';
import UsersTable from '../../components/shared/UsersTable';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../context/AuthContext';

const DEPARTMENTS = ['HR', 'Engineering', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design'];

// ── Stat card ─────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, iconBg, iconColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon size={20} className={iconColor} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500 mb-0.5">{title}</p>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
    </div>
  </motion.div>
);

// ── Assign card ───────────────────────────────────────────────
const AssignCard = ({ employees }) => {
  const [selectedEmp, setSelectedEmp]   = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [assignments, setAssignments]   = useState([]);
  const [msg, setMsg]                   = useState('');

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all";

  const handleAssign = () => {
    if (!selectedEmp || !selectedDept) { setMsg('Please select an employee and a department.'); return; }
    const emp = employees.find(e => String(e.id) === selectedEmp);
    setAssignments(prev => [
      ...prev.filter(a => a.empId !== emp.id),
      { empId: emp.id, empName: emp.full_name, dept: selectedDept, task: selectedTask || 'General' },
    ]);
    setMsg(`✅ ${emp.full_name} assigned to ${selectedDept}`);
    setSelectedEmp(''); setSelectedDept(''); setSelectedTask('');
  };

  return (
    <PanelCard icon={Link2} title="Assign Department / Task" subtitle="Assign employees to departments or roles">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Employee</label>
            <select value={selectedEmp} onChange={e => { setSelectedEmp(e.target.value); setMsg(''); }} className={inputCls}>
              <option value="">— Select Employee —</option>
              {employees.filter(e => e.status === 'active').map(e => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
            <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setMsg(''); }} className={inputCls}>
              <option value="">— Select Department —</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Task / Role (optional)</label>
            <input type="text" value={selectedTask} onChange={e => setSelectedTask(e.target.value)}
              placeholder="e.g. Frontend Developer, HR Executive..."
              className={inputCls} />
          </div>
        </div>

        <button onClick={handleAssign}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all">
          Assign
        </button>

        {msg && <p className="text-xs text-gray-500">{msg}</p>}

        {assignments.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {assignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm">
                <span className="font-medium text-gray-700">{a.empName}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{a.dept}</span>
                  <span className="text-gray-400">{a.task}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelCard>
  );
};

// ── Main page ─────────────────────────────────────────────────
export default function EmployeeManagement() {
  const { user } = useAuth();
  const { users, loading, error, createUser, updateUser, toggleStatus, suspendUser } = useUsers();

  const employees = users.filter(u => u.role === 'employee');
  const active    = employees.filter(e => e.status === 'active').length;
  const inactive  = employees.filter(e => e.status === 'inactive').length;
  const suspended = employees.filter(e => e.status === 'suspended').length;

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData]   = useState(null);

  const handleEdit   = (u) => { setEditData(u); setModalOpen(true); };
  const handleClose  = ()  => { setEditData(null); setModalOpen(false); };
  const handleSubmit = async (form) => {
    if (editData) await updateUser(editData.id, form);
    else await createUser({ ...form, role: 'employee' });
  };

  return (
    <PageWrapper title="Employee Management">
      <div className="space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Employees" value={employees.length} icon={Users}     iconBg="bg-blue-50"   iconColor="text-blue-500"  delay={0}    />
          <StatCard title="Active"          value={active}           icon={UserCheck} iconBg="bg-green-50"  iconColor="text-green-500" delay={0.05} />
          <StatCard title="Inactive"        value={inactive}         icon={UserX}     iconBg="bg-gray-100"  iconColor="text-gray-400"  delay={0.1}  />
          <StatCard title="Suspended"       value={suspended}        icon={Briefcase} iconBg="bg-red-50"    iconColor="text-red-400"   delay={0.15} />
        </div>

        {/* ── Create + Assign ── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          <PanelCard icon={UserPlus} title="Create Employee" subtitle="New employee credentials will be sent via email">
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Fill in the details to register a new employee. A secure temporary password
                will be auto-generated and emailed. They must change it on first login.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {[
                  'Auto-generated Employee ID (EMP001...)',
                  'Temporary password emailed securely',
                  'Forced password change on first login',
                  '1 Casual Leave auto-assigned',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setEditData(null); setModalOpen(true); }}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all"
              >
                <UserPlus size={16} />
                Create New Employee
              </button>
            </div>
          </PanelCard>

          <AssignCard employees={employees} />
        </div>

        {/* ── Table ── */}
        <PanelCard icon={Users} title="Employees Overview" subtitle={`${employees.length} total employees`}>
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading employees...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : (
            <UsersTable
              users={employees}
              onEdit={handleEdit}
              onToggleStatus={toggleStatus}
              onSuspend={suspendUser}
            />
          )}
        </PanelCard>

      </div>

      <UserFormModal
        open={modalOpen} onClose={handleClose} onSubmit={handleSubmit}
        defaultRole="employee" allowAdminRole={user?.role === 'super_admin'} editData={editData}
      />
    </PageWrapper>
  );
}
