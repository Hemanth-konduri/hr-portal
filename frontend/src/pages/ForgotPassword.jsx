import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🔐</div>
          <h1 style={styles.title}>Forgot Password</h1>
          <p style={styles.subtitle}>
            {submitted ? 'Check your email for the OTP' : "Enter your email and we'll send you a reset OTP"}
          </p>
        </div>

        {submitted ? (
          <div style={styles.successBox}>
            <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#276749' }}>✅ OTP Sent!</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#2f855a' }}>
              If this email is registered, a 6-digit OTP has been sent. Check your inbox.
            </p>
            <Link to="/reset-password" style={{ ...styles.btn, display: 'block', textAlign: 'center', marginTop: '20px', textDecoration: 'none' }}>
              Enter OTP →
            </Link>
          </div>
        ) : (
          <>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={onSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input style={styles.input} type="email" placeholder="Enter your registered email"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        <p style={styles.footer}>
          <Link to="/login" style={styles.link}>← Back to Login</Link>
        </p>
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
  error: { background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' },
  successBox: { background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '10px', padding: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#4a5568' },
  input: { padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', outline: 'none', color: '#1a202c' },
  btn: { background: 'linear-gradient(135deg, #0f3460, #1a1a2e)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  footer: { textAlign: 'center', marginTop: '24px', fontSize: '14px' },
  link: { color: '#0f3460', fontWeight: '600', textDecoration: 'none' },
};

export default ForgotPassword;
