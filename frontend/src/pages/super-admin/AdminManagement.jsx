import { useState } from 'react';
import { UserCog, Link2, ShieldCheck, UserPlus, Users, UserCheck, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import PageWrapper from '../../components/layout/PageWrapper';
import PanelCard from '../../components/dashboard/PanelCard';
import UserFormModal from '../../components/shared/UserFormModal';
import UsersTable from '../../components/shared/UsersTable';
import { useUsers } from '../../hooks/useUsers';

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
const AssignCard = ({ admins, employees }) => {
  const [selectedAdmin, setSelectedAdmin]       = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [assignments, setAssignments]           = useState([]);
  const [msg, setMsg]                           = useState('');

  const handleAssign = () => {
    if (!selectedAdmin || !selectedEmployee) {
      setMsg('Please select both an admin and an employee.');
      return;
    }
    const admin = admins.find(a => String(a.id) === selectedAdmin);
    const emp   = employees.find(e => String(e.id) === selectedEmployee);
    const already = assignments.find(a => a.empId === emp.id && a.adminId === admin.id);
    if (already) { setMsg(`${emp.full_name} is already assigned to ${admin.full_name}.`); return; }
    setAssignments(prev => [...prev, { adminId: admin.id, adminName: admin.full_name, empId: emp.id, empName: emp.full_name }]);
    setMsg(`✅ ${emp.full_name} assigned to ${admin.full_name}`);
    setSelectedEmployee('');
  };

  const inputCls = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all";

  return (
    <PanelCard icon={Link2} title="Assign Employees to Admin" subtitle="Map employees under an admin manager">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Select Admin</label>
            <select value={selectedAdmin} onChange={e => { setSelectedAdmin(e.target.value); setMsg(''); }} className={inputCls}>
              <option value="">— Choose Admin —</option>
              {admins.filter(a => a.status === 'active').map(a => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Select Employee</label>
            <select value={selectedEmployee} onChange={e => { setSelectedEmployee(e.target.value); setMsg(''); }} className={inputCls}>
              <option value="">— Choose Employee —</option>
              {employees.filter(e => e.status === 'active').map(e => (
                <option key={e.id} value={e.id}>{e.full_name} ({e.employee_id})</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={handleAssign}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all">
          Assign Employee
        </button>

        {msg && <p className="text-xs text-gray-500">{msg}</p>}

        {assignments.length > 0 && (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {assignments.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm">
                <span className="font-medium text-gray-700">{a.empName}</span>
                <span className="text-gray-400 text-xs">→ {a.adminName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelCard>
  );
};

// ── Main page ─────────────────────────────────────────────────
export default function AdminManagement() {
  const { users: allUsers, loading, error, createUser, updateUser, toggleStatus, suspendUser } = useUsers();

  const admins    = allUsers.filter(u => u.role === 'admin');
  const employees = allUsers.filter(u => u.role === 'employee');

  const activeAdmins   = admins.filter(a => a.status === 'active').length;
  const inactiveAdmins = admins.filter(a => a.status !== 'active').length;

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData]   = useState(null);

  const handleEdit  = (user) => { setEditData(user); setModalOpen(true); };
  const handleClose = ()     => { setEditData(null); setModalOpen(false); };
  const handleSubmit = async (form) => {
    if (editData) await updateUser(editData.id, form);
    else await createUser({ ...form, role: 'admin' });
  };

  return (
    <PageWrapper title="Admin Management">
      <div className="space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Admins"    value={admins.length}    icon={ShieldCheck} iconBg="bg-amber-50"  iconColor="text-amber-500" delay={0}    />
          <StatCard title="Active Admins"   value={activeAdmins}     icon={UserCheck}   iconBg="bg-green-50"  iconColor="text-green-500" delay={0.05} />
          <StatCard title="Inactive Admins" value={inactiveAdmins}   icon={UserX}       iconBg="bg-gray-100"  iconColor="text-gray-400"  delay={0.1}  />
          <StatCard title="Total Employees" value={employees.length} icon={Users}       iconBg="bg-blue-50"   iconColor="text-blue-500"  delay={0.15} />
        </div>

        {/* ── Create + Assign ── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          <PanelCard icon={UserPlus} title="Create Admin" subtitle="New admin credentials will be sent via email">
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Admins can manage employees, approve leaves, upload payslips and post announcements.
                Only Super Admin can create admins.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                {['Manage employees & attendance', 'Approve / reject leave requests', 'Upload payslips & documents', 'Post company announcements'].map(f => (
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
                Create New Admin
              </button>
            </div>
          </PanelCard>

          <AssignCard admins={admins} employees={employees} />
        </div>

        {/* ── Table ── */}
        <PanelCard icon={UserCog} title="Admins Overview" subtitle={`${admins.length} admin accounts`}>
          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : (
            <UsersTable users={admins} onEdit={handleEdit} onToggleStatus={toggleStatus} onSuspend={suspendUser} />
          )}
        </PanelCard>

      </div>

      <UserFormModal
        open={modalOpen} onClose={handleClose} onSubmit={handleSubmit}
        defaultRole="admin" allowAdminRole={false} editData={editData}
      />
    </PageWrapper>
  );
}
