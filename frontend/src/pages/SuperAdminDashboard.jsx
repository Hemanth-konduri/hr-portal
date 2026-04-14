import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={styles.page}>
      <div style={styles.navbar}>
        <span style={styles.brand}>🏢 HR Portal</span>
        <div style={styles.navRight}>
          <span style={styles.userInfo}>👤 {user?.full_name} <span style={styles.badge}>Super Admin</span></span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div style={styles.content}>
        <h1 style={styles.heading}>Super Admin Dashboard</h1>
        <p style={styles.sub}>Welcome back, {user?.full_name}. More modules coming soon.</p>
        <div style={styles.grid}>
          <div style={styles.card}><div style={styles.cardIcon}>👥</div><div style={styles.cardLabel}>Manage Users</div><div style={styles.cardSub}>Create admins & employees</div></div>
          <div style={styles.card}><div style={styles.cardIcon}>🏗️</div><div style={styles.cardLabel}>Departments</div><div style={styles.cardSub}>Manage departments</div></div>
          <div style={styles.card}><div style={styles.cardIcon}>📊</div><div style={styles.cardLabel}>Reports</div><div style={styles.cardSub}>View audit logs</div></div>
          <div style={styles.card}><div style={styles.cardIcon}>⚙️</div><div style={styles.cardLabel}>Settings</div><div style={styles.cardSub}>System configuration</div></div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  navbar: { background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: '#fff', fontSize: '20px', fontWeight: '700' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userInfo: { color: '#a0b4cc', fontSize: '14px' },
  badge: { background: '#0f3460', color: '#63b3ed', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', marginLeft: '6px', border: '1px solid #63b3ed' },
  logoutBtn: { background: 'transparent', border: '1px solid #e53e3e', color: '#fc8181', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  content: { padding: '40px 32px' },
  heading: { fontSize: '28px', fontWeight: '700', color: '#1a202c', margin: '0 0 8px' },
  sub: { color: '#718096', marginBottom: '32px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', padding: '28px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform 0.2s' },
  cardIcon: { fontSize: '32px', marginBottom: '12px' },
  cardLabel: { fontWeight: '700', color: '#1a202c', fontSize: '15px', marginBottom: '4px' },
  cardSub: { fontSize: '13px', color: '#718096' },
};

export default SuperAdminDashboard;
