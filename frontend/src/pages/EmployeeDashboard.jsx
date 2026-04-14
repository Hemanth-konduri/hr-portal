import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={styles.page}>
      <div style={styles.navbar}>
        <span style={styles.brand}>🏢 HR Portal</span>
        <div style={styles.navRight}>
          <span style={styles.userInfo}>👤 {user?.full_name} <span style={styles.badge}>Employee</span></span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div style={styles.content}>
        <h1 style={styles.heading}>Employee Dashboard</h1>
        <p style={styles.sub}>Welcome back, {user?.full_name}. More modules coming soon.</p>
        <div style={styles.grid}>
          <div style={styles.card}><div style={styles.cardIcon}>📅</div><div style={styles.cardLabel}>My Attendance</div><div style={styles.cardSub}>Check in & check out</div></div>
          <div style={styles.card}><div style={styles.cardIcon}>🏖️</div><div style={styles.cardLabel}>My Leaves</div><div style={styles.cardSub}>Apply for leave</div></div>
          <div style={styles.card}><div style={styles.cardIcon}>💰</div><div style={styles.cardLabel}>My Payslips</div><div style={styles.cardSub}>View & download payslips</div></div>
          <div style={styles.card}><div style={styles.cardIcon}>📢</div><div style={styles.cardLabel}>Announcements</div><div style={styles.cardSub}>Company updates</div></div>
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
  badge: { background: '#0f3460', color: '#fbd38d', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', marginLeft: '6px', border: '1px solid #fbd38d' },
  logoutBtn: { background: 'transparent', border: '1px solid #e53e3e', color: '#fc8181', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  content: { padding: '40px 32px' },
  heading: { fontSize: '28px', fontWeight: '700', color: '#1a202c', margin: '0 0 8px' },
  sub: { color: '#718096', marginBottom: '32px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', padding: '28px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' },
  cardIcon: { fontSize: '32px', marginBottom: '12px' },
  cardLabel: { fontWeight: '700', color: '#1a202c', fontSize: '15px', marginBottom: '4px' },
  cardSub: { fontSize: '13px', color: '#718096' },
};

export default EmployeeDashboard;
