const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { sendCredentialsMail } = require('../utils/email');
const { generateTempPassword, generateEmployeeId } = require('../utils/helpers');

// ─── Helper: log audit ───────────────────────────────────────
const auditLog = async (userId, action, targetUserId = null, details = null, ip = null) => {
  await pool.query(
    'INSERT INTO audit_logs (user_id, action, target_user_id, details, ip_address) VALUES (?, ?, ?, ?, ?)',
    [userId, action, targetUserId, details, ip]
  );
};

const resolveDepartmentId = async (departmentIdOrName) => {
  if (!departmentIdOrName) return null;
  const rawValue = String(departmentIdOrName).trim();
  if (/^\d+$/.test(rawValue)) {
    return Number(rawValue);
  }

  const [rows] = await pool.query(
    'SELECT id FROM departments WHERE TRIM(LOWER(name)) = LOWER(?)',
    [rawValue]
  );

  if (!rows.length) {
    console.warn('Department lookup failed for:', rawValue);
    throw new Error('Invalid department');
  }
  return rows[0].id;
};

// ════════════════════════════════════════════════════════════
// POST /api/users/create
// Super Admin → can create admin or employee
// Admin       → can create employee only
// ════════════════════════════════════════════════════════════
const createUser = async (req, res) => {
  try {
    const { full_name, email, role, department_id: departmentIdRaw, position, phone, date_of_joining } = req.body;
    let department_id = null;

    if (departmentIdRaw) {
      try {
        department_id = await resolveDepartmentId(departmentIdRaw);
      } catch (error) {
        return res.status(400).json({ msg: 'Invalid department selected' });
      }
    }

    if (!full_name || !email || !role) {
      return res.status(400).json({ msg: 'Name, email and role are required' });
    }

    // Role permission check
    if (role === 'super_admin') {
      return res.status(403).json({ msg: 'Cannot create another Super Admin' });
    }

    if (role === 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ msg: 'Only Super Admin can create Admins' });
    }

    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role. Must be admin or employee' });
    }

    // Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ msg: 'Email already registered' });

    // Generate employee ID
    const [countRows] = await pool.query('SELECT COUNT(*) AS count FROM users');
    const employee_id = generateEmployeeId(countRows[0].count);

    // Generate temp password and hash it
    const tempPassword = generateTempPassword();
    const password_hash = await bcrypt.hash(tempPassword, 12);

    const [result] = await pool.query(
      `INSERT INTO users
        (employee_id, full_name, email, password_hash, role, status, department_id, position, phone, date_of_joining, created_by, password_reset_required)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, true)`,
      [employee_id, full_name, email, password_hash, role, department_id || null, position || null, phone || null, date_of_joining || null, req.user.id]
    );

    // Create leave balance record for employees
    if (role === 'employee') {
      await pool.query('INSERT INTO leave_balance (user_id) VALUES (?)', [result.insertId]);
    }

    // Send credentials via email
    await sendCredentialsMail({ to: email, name: full_name, email, password: tempPassword, role });

    await auditLog(req.user.id, 'USER_CREATED', result.insertId, `Role: ${role}`, req.ip);

    res.status(201).json({
      msg: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully. Credentials sent to ${email}`,
      user: { id: result.insertId, employee_id, full_name, email, role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// GET /api/users
// Super Admin → all users | Admin → employees only
// ════════════════════════════════════════════════════════════
const getAllUsers = async (req, res) => {
  try {
    let query = `
      SELECT u.id, u.employee_id, u.full_name, u.email, u.role, u.status,
             u.position, u.phone, u.date_of_joining, u.created_at,
             d.name AS department
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
    `;
    const params = [];

    if (req.user.role === 'admin') {
      query += ' WHERE u.role = ?';
      params.push('employee');
    }

    query += ' ORDER BY u.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// GET /api/users/:id
// ════════════════════════════════════════════════════════════
const getUserById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.employee_id, u.full_name, u.email, u.role, u.status,
              u.position, u.phone, u.date_of_birth, u.date_of_joining,
              u.profile_photo, u.address, u.created_at,
              d.name AS department
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ msg: 'User not found' });

    // Admin can only view employees
    if (req.user.role === 'admin' && rows[0].role !== 'employee') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// PATCH /api/users/:id/status
// Super Admin → manage all | Admin → manage employees only
// ════════════════════════════════════════════════════════════
const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const [rows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ msg: 'User not found' });

    const targetUser = rows[0];

    // Admin can only manage employees
    if (req.user.role === 'admin' && targetUser.role !== 'employee') {
      return res.status(403).json({ msg: 'Admins can only manage employees' });
    }

    // Prevent self-deactivation
    if (req.user.id === targetUser.id) {
      return res.status(400).json({ msg: 'You cannot change your own status' });
    }

    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);

    await auditLog(req.user.id, 'USER_STATUS_CHANGED', targetUser.id, `Status: ${status}`, req.ip);

    res.json({ msg: `User status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════
// PUT /api/users/:id
// Update user profile details
// ════════════════════════════════════════════════════════════
const updateUser = async (req, res) => {
  try {
    const { full_name, position, phone, department_id: departmentIdRaw, date_of_joining, address, date_of_birth } = req.body;
    let department_id = null;

    if (departmentIdRaw) {
      try {
        department_id = await resolveDepartmentId(departmentIdRaw);
      } catch (error) {
        return res.status(400).json({ msg: 'Invalid department selected' });
      }
    }

    const [rows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ msg: 'User not found' });

    if (req.user.role === 'admin' && rows[0].role !== 'employee') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    await pool.query(
      `UPDATE users SET full_name = COALESCE(?, full_name), position = COALESCE(?, position),
       phone = COALESCE(?, phone), department_id = COALESCE(?, department_id),
       date_of_joining = COALESCE(?, date_of_joining), address = COALESCE(?, address),
       date_of_birth = COALESCE(?, date_of_birth)
       WHERE id = ?`,
      [full_name, position, phone, department_id, date_of_joining, address, date_of_birth, req.params.id]
    );

    await auditLog(req.user.id, 'USER_UPDATED', req.params.id, null, req.ip);

    res.json({ msg: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = { createUser, getAllUsers, getUserById, updateUserStatus, updateUser };
