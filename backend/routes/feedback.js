const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Submit feedback (Employee)
router.post('/', async (req, res) => {
  try {
    const { feedback_text, is_anonymous } = req.body;
    await pool.query(
      'INSERT INTO feedback_forms (user_id, feedback_text, is_anonymous) VALUES (?, ?, ?)',
      [req.user.id, feedback_text, is_anonymous ? true : false]
    );
    res.json({ msg: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// View all feedback (Admin)
router.get('/all', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, 
             IF(f.is_anonymous, 'Anonymous', u.full_name) as author_name,
             IF(f.is_anonymous, NULL, u.employee_id) as author_id
      FROM feedback_forms f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;