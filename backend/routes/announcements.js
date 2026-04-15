const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Get all active announcements
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.full_name as author 
      FROM announcements a 
      JOIN users u ON a.posted_by = u.id 
      WHERE a.is_active = true 
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create announcement (Admin)
router.post('/', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { title, content } = req.body;
    await pool.query(
      'INSERT INTO announcements (title, content, posted_by) VALUES (?, ?, ?)',
      [title, content, req.user.id]
    );
    res.json({ msg: 'Announcement created' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete/deactivate announcement (Admin)
router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    await pool.query('UPDATE announcements SET is_active = false WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Announcement removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;