const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Submit daily work update (Employee)
router.post('/', async (req, res) => {
  try {
    const { update_text } = req.body;
    const date = new Date().toISOString().split('T')[0];
    
    await pool.query(
      'INSERT INTO work_updates (user_id, date, update_text) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE update_text = ?',
      [req.user.id, date, update_text, update_text]
    );
    res.json({ msg: 'Work update submitted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get recent updates (Admin sees all, Employee sees own or team)
router.get('/', async (req, res) => {
  try {
    let query, params;
    if (['admin', 'super_admin'].includes(req.user.role)) {
      query = `SELECT wu.*, u.full_name, u.employee_id 
               FROM work_updates wu JOIN users u ON wu.user_id = u.id 
               ORDER BY wu.date DESC, wu.created_at DESC LIMIT 50`;
      params = [];
    } else {
      query = `SELECT wu.*, u.full_name, u.employee_id 
               FROM work_updates wu JOIN users u ON wu.user_id = u.id 
               WHERE wu.user_id = ?
               ORDER BY wu.date DESC, wu.created_at DESC LIMIT 10`;
      params = [req.user.id];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;