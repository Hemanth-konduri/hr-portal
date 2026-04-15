import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Auth
import SetupSuperAdmin from './pages/auth/SetupSuperAdmin';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ChangePassword from './pages/auth/ChangePassword';

// Super Admin
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import AdminManagement from './pages/super-admin/AdminManagement';

// Admin + Super Admin shared pages
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import LeaveApprovals from './pages/admin/LeaveApprovals';
import PayrollManagement from './pages/admin/PayrollManagement';
import Announcements from './pages/admin/Announcements';

// Employee
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import LeaveApplication from './pages/employee/LeaveApplication';
import Payslips from './pages/employee/Payslips';
import PerformanceCenter from './pages/employee/PerformanceCenter';
import DocumentsCenter from './pages/employee/DocumentsCenter';

const SA = ['super_admin'];
const AD = ['admin'];
const SA_AD = ['super_admin', 'admin'];
const ALL = ['super_admin', 'admin', 'employee'];
const EMP = ['employee'];

const Wrap = ({ roles, children }) => <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/setup" element={<SetupSuperAdmin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/change-password" element={<Wrap roles={ALL}><ChangePassword /></Wrap>} />

          {/* Super Admin only */}
          <Route path="/super-admin/dashboard" element={<Wrap roles={SA}><SuperAdminDashboard /></Wrap>} />
          <Route path="/super-admin/admins"    element={<Wrap roles={SA}><AdminManagement /></Wrap>} />

          {/* Super Admin + Admin shared */}
          <Route path="/admin/dashboard"    element={<Wrap roles={SA_AD}><AdminDashboard /></Wrap>} />
          <Route path="/admin/employees"    element={<Wrap roles={SA_AD}><EmployeeManagement /></Wrap>} />
          <Route path="/admin/attendance"   element={<Wrap roles={SA_AD}><AttendanceManagement /></Wrap>} />
          <Route path="/admin/leaves"       element={<Wrap roles={SA_AD}><LeaveApprovals /></Wrap>} />
          <Route path="/admin/payroll"      element={<Wrap roles={SA_AD}><PayrollManagement /></Wrap>} />
          <Route path="/admin/announcements"element={<Wrap roles={SA_AD}><Announcements /></Wrap>} />

          {/* Employee */}
          <Route path="/employee/dashboard"   element={<Wrap roles={EMP}><EmployeeDashboard /></Wrap>} />
          <Route path="/employee/leaves"      element={<Wrap roles={EMP}><LeaveApplication /></Wrap>} />
          <Route path="/employee/payroll"     element={<Wrap roles={EMP}><Payslips /></Wrap>} />
          <Route path="/employee/performance" element={<Wrap roles={EMP}><PerformanceCenter /></Wrap>} />
          <Route path="/employee/documents"   element={<Wrap roles={EMP}><DocumentsCenter /></Wrap>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
