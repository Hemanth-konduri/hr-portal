import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const SetupSuperAdmin = () => {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/setup-status').then((res) => {
      if (res.data.setup_completed) navigate('/login', { replace: true });
      else setChecking(false);
    }).catch(() => setChecking(false));
  }, [navigate]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/setup', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <div style={styles.center}><p>Checking setup status...</p></div>;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🏢</div>
          <h1 style={styles.title}>HR Portal Setup</h1>
          <p style={styles.subtitle}>Create your Super Admin account to get started</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={onSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input style={styles.input} type="text" name="full_name" placeholder="Enter your full name"
              value={formData.full_name} onChange={onChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input style={styles.input} type="email" name="email" placeholder="Enter your email"
              value={formData.email} onChange={onChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" name="password" placeholder="Min 8 chars, upper, lower, number, special"
              value={formData.password} onChange={onChange} required />
          </div>
          <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Super Admin Account'}
          </button>
        </form>

        <p style={styles.footer}>
          Already set up? <Link to="/login" style={styles.link}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fff', borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header: { textAlign: 'center', marginBottom: '32px' },
  icon: { fontSize: '48px', marginBottom: '12px' },
  title: { fontSize: '26px', fontWeight: '700', color: '#1a202c', margin: '0 0 8px' },
  subtitle: { fontSize: '14px', color: '#718096', margin: 0 },
  error: { background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#4a5568' },
  input: { padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#1a202c' },
  btn: { background: 'linear-gradient(135deg, #0f3460, #1a1a2e)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },
  footer: { textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#718096' },
  link: { color: '#0f3460', fontWeight: '600', textDecoration: 'none' },
};

export default SetupSuperAdmin;
