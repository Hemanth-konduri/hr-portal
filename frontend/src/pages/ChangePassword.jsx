import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ChangePassword = () => {
  const [formData, setFormData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.new_password !== formData.confirm_password) {
      return setError('New passwords do not match');
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: formData.current_password,
        new_password: formData.new_password,
      });

      // Update user in context so password_reset_required is cleared
      const updatedUser = { ...user, password_reset_required: false };
      login(localStorage.getItem('token'), updatedUser);

      if (user.role === 'super_admin') navigate('/super-admin/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/employee/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🔒</div>
          <h1 style={styles.title}>Change Password</h1>
          <p style={styles.subtitle}>
            {user?.password_reset_required
              ? 'You must change your password before continuing'
              : 'Update your account password'}
          </p>
        </div>

        {user?.password_reset_required && (
          <div style={styles.warningBox}>
            ⚠️ This is your first login. Please set a new password to continue.
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={onSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Current Password</label>
            <input style={styles.input} type="password" name="current_password" placeholder="Enter current password"
              value={formData.current_password} onChange={onChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input style={styles.input} type="password" name="new_password" placeholder="Min 8 chars, upper, lower, number, special"
              value={formData.new_password} onChange={onChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm New Password</label>
            <input style={styles.input} type="password" name="confirm_password" placeholder="Re-enter new password"
              value={formData.confirm_password} onChange={onChange} required />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  card: { background: '#fff', borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { textAlign: 'center', marginBottom: '32px' },
  icon: { fontSize: '48px', marginBottom: '12px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#1a202c', margin: '0 0 8px' },
  subtitle: { fontSize: '14px', color: '#718096', margin: 0 },
  warningBox: { background: '#fffbeb', border: '1px solid #f6e05e', color: '#744210', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' },
  error: { background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#4a5568' },
  input: { padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', color: '#1a202c' },
  btn: { background: 'linear-gradient(135deg, #0f3460, #1a1a2e)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default ChangePassword;
