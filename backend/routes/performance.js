const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Submit performance review (Admin)
router.post('/', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { user_id, period, rating, feedback } = req.body;
    await pool.query(
      'INSERT INTO performance (user_id, reviewed_by, period, rating, feedback) VALUES (?, ?, ?, ?, ?)',
      [user_id, req.user.id, period, rating, feedback]
    );
    res.json({ msg: 'Performance review submitted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's own performance reviews (Employee)
router.get('/my', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM performance WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all reviews (Admin)
router.get('/all', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.full_name, u.employee_id 
      FROM performance p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
