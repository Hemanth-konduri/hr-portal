const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verify JWT token
const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB to check status
    const [rows] = await pool.query(
      'SELECT id, role, status, password_reset_required FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!rows.length) return res.status(401).json({ msg: 'User not found' });

    const user = rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ msg: 'Your account is suspended or inactive. Contact admin.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Role-based authorization — pass allowed roles as array
// Usage: authorize('super_admin', 'admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
