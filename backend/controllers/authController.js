const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendCredentialsMail, sendPasswordResetMail, sendPasswordResetSuccessMail } = require('../utils/email');
const { generateResetToken, hashToken } = require('../utils/helpers');

// ─── Helper: sign JWT ────────────────────────────────────────
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// ─── Helper: validate password strength ─────────────────────
const isStrongPassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$!%*?&])[A-Za-z\d@#$!%*?&]{8,}$/;
  return regex.test(password);
};

// ─── Helper: log audit ───────────────────────────────────────
const auditLog = async (userId, action, targetUserId = null, details = null, ip = null) => {
  await pool.query(
    'INSERT INTO audit_logs (user_id, action, target_user_id, details, ip_address) VALUES (?, ?, ?, ?, ?)',
    [userId, action, targetUserId, details, ip]
  );
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/setup
// One-time Super Admin registration — disabled after first use
// ════════════════════════════════════════════════════════════
const setupSuperAdmin = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM system_settings WHERE id = 1');

    if (settings[0].setup_completed) {
      return res.status(403).json({ msg: 'Registration is closed. Contact administrator.' });
    }

    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email and password are required' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        msg: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
      });
    }

    // Check email not already used
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ msg: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, status, employee_id, password_reset_required)
       VALUES (?, ?, ?, 'super_admin', 'active', 'SA001', false)`,
      [full_name, email, password_hash]
    );

    // Lock registration permanently
    await pool.query(
      'UPDATE system_settings SET registration_open = false, setup_completed = true WHERE id = 1'
    );

    await auditLog(result.insertId, 'SUPER_ADMIN_CREATED', null, 'Initial setup', req.ip);

    const token = signToken(result.insertId, 'super_admin');

    res.status(201).json({
      msg: 'Super Admin created successfully',
      token,
      user: { id: result.insertId, full_name, email, role: 'super_admin' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// GET /api/auth/setup-status
// Frontend checks this to show/hide signup page
// ════════════════════════════════════════════════════════════
const getSetupStatus = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT setup_completed FROM system_settings WHERE id = 1');
    res.json({ setup_completed: settings[0].setup_completed });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/login
// ════════════════════════════════════════════════════════════
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }

    const [rows] = await pool.query(
      `SELECT id, full_name, email, password_hash, role, status,
              password_reset_required, failed_login_attempts, account_locked_until
       FROM users WHERE email = ?`,
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ msg: 'Invalid email or password' });
    }

    const user = rows[0];

    // Check account lock
    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      const unlockTime = new Date(user.account_locked_until).toLocaleTimeString();
      return res.status(403).json({ msg: `Account locked. Try again after ${unlockTime}` });
    }

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({ msg: 'Your account is suspended or inactive. Contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      const attempts = user.failed_login_attempts + 1;

      if (attempts >= 5) {
        // Lock for 30 minutes
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await pool.query(
          'UPDATE users SET failed_login_attempts = ?, account_locked_until = ? WHERE id = ?',
          [attempts, lockUntil, user.id]
        );
        await auditLog(user.id, 'ACCOUNT_LOCKED', null, '5 failed attempts', req.ip);
        return res.status(403).json({ msg: 'Too many failed attempts. Account locked for 30 minutes.' });
      }

      await pool.query('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [attempts, user.id]);
      await auditLog(user.id, 'LOGIN_FAILED', null, `Attempt ${attempts}`, req.ip);
      return res.status(401).json({ msg: 'Invalid email or password' });
    }

    // Reset failed attempts on success
    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, account_locked_until = NULL WHERE id = ?',
      [user.id]
    );

    await auditLog(user.id, 'LOGIN_SUCCESS', null, null, req.ip);

    const token = signToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        password_reset_required: user.password_reset_required,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/change-password
// Forced on first login — also used for voluntary change
// ════════════════════════════════════════════════════════════
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ msg: 'Current and new password are required' });
    }

    if (!isStrongPassword(new_password)) {
      return res.status(400).json({
        msg: 'New password must be at least 8 characters with uppercase, lowercase, number and special character',
      });
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);

    if (!isMatch) return res.status(400).json({ msg: 'Current password is incorrect' });

    const password_hash = await bcrypt.hash(new_password, 12);

    await pool.query(
      'UPDATE users SET password_hash = ?, password_reset_required = false WHERE id = ?',
      [password_hash, req.user.id]
    );

    await auditLog(req.user.id, 'PASSWORD_CHANGED', null, null, req.ip);

    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// Sends 6-digit OTP to email (valid 15 min)
// ════════════════════════════════════════════════════════════
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    const [rows] = await pool.query('SELECT id, full_name FROM users WHERE email = ?', [email]);

    // Always return success to prevent email enumeration
    if (!rows.length) return res.json({ msg: 'If this email exists, a reset OTP has been sent' });

    const user = rows[0];
    const token = generateResetToken();           // 6-digit OTP
    const tokenHash = hashToken(token);           // store hash only
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await pool.query(
      'UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ?, reset_token_used = false WHERE id = ?',
      [tokenHash, expiresAt, user.id]
    );

    await sendPasswordResetMail({ to: email, name: user.full_name, token });
    await auditLog(user.id, 'PASSWORD_RESET_REQUESTED', null, null, req.ip);

    res.json({ msg: 'If this email exists, a reset OTP has been sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// POST /api/auth/reset-password
// Verify OTP and set new password
// ════════════════════════════════════════════════════════════
const resetPassword = async (req, res) => {
  try {
    const { email, token, new_password } = req.body;

    if (!email || !token || !new_password) {
      return res.status(400).json({ msg: 'Email, OTP and new password are required' });
    }

    if (!isStrongPassword(new_password)) {
      return res.status(400).json({
        msg: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
      });
    }

    const [rows] = await pool.query(
      `SELECT id, reset_token_hash, reset_token_expires_at, reset_token_used
       FROM users WHERE email = ?`,
      [email]
    );

    if (!rows.length) return res.status(400).json({ msg: 'Invalid request' });

    const user = rows[0];

    if (user.reset_token_used) return res.status(400).json({ msg: 'OTP already used' });
    if (new Date(user.reset_token_expires_at) < new Date()) return res.status(400).json({ msg: 'OTP expired' });

    const tokenHash = hashToken(token);
    if (tokenHash !== user.reset_token_hash) return res.status(400).json({ msg: 'Invalid OTP' });

    const password_hash = await bcrypt.hash(new_password, 12);

    await pool.query(
      `UPDATE users SET password_hash = ?, reset_token_hash = NULL,
       reset_token_expires_at = NULL, reset_token_used = true,
       password_reset_required = false WHERE id = ?`,
      [password_hash, user.id]
    );

    await auditLog(user.id, 'PASSWORD_RESET_SUCCESS', null, null, req.ip);

    // Send success confirmation email
    const [userRows] = await pool.query('SELECT full_name FROM users WHERE id = ?', [user.id]);
    await sendPasswordResetSuccessMail({ to: email, name: userRows[0].full_name });

    res.json({ msg: 'Password reset successfully. You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// GET /api/auth/me
// Get logged in user profile
// ════════════════════════════════════════════════════════════
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.employee_id, u.full_name, u.email, u.role, u.status,
              u.position, u.phone, u.profile_photo, u.date_of_joining,
              u.password_reset_required, d.name AS department
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { setupSuperAdmin, getSetupStatus, login, changePassword, forgotPassword, resetPassword, getMe };
