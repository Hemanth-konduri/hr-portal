const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// ── GET /my  — employee's own reviews ─────────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.full_name AS reviewer_name
       FROM performance p
       LEFT JOIN users u ON p.reviewed_by = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /my/stats  — aggregated stats for the employee ────────────────────
router.get('/my/stats', async (req, res) => {
  try {
    const [[stats]] = await pool.query(
      `SELECT
         COUNT(*)                        AS total_reviews,
         ROUND(AVG(rating), 2)           AS avg_rating,
         MAX(rating)                     AS highest_rating,
         MIN(rating)                     AS lowest_rating,
         SUM(rating = 5)                 AS excellent,
         SUM(rating = 4)                 AS good,
         SUM(rating = 3)                 AS average,
         SUM(rating <= 2)                AS needs_improvement
       FROM performance
       WHERE user_id = ?`,
      [req.user.id]
    );
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /all  — all reviews (admin) ───────────────────────────────────────
router.get('/all', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = `
      SELECT p.*,
             e.full_name, e.employee_id,
             d.name AS department,
             r.full_name AS reviewer_name
      FROM performance p
      JOIN users e ON p.user_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN users r ON p.reviewed_by = r.id
    `;
    const params: any[] = [];
    if (user_id) { query += ' WHERE p.user_id = ?'; params.push(user_id); }
    query += ' ORDER BY p.created_at DESC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /stats  — aggregate stats per employee (admin) ────────────────────
router.get('/stats', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id, u.full_name, u.employee_id,
        d.name AS department,
        COUNT(p.id)              AS total_reviews,
        ROUND(AVG(p.rating), 2)  AS avg_rating,
        MAX(p.rating)            AS highest,
        MIN(p.rating)            AS lowest,
        MAX(p.created_at)        AS last_reviewed
      FROM users u
      LEFT JOIN performance p ON p.user_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'employee' AND u.status = 'active'
      GROUP BY u.id, u.full_name, u.employee_id, d.name
      ORDER BY avg_rating DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /  — create review (admin) ───────────────────────────────────────
router.post('/', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { user_id, period, rating, feedback } = req.body;
    if (!user_id || !period || !rating) {
      return res.status(400).json({ msg: 'user_id, period and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }
    await pool.query(
      'INSERT INTO performance (user_id, reviewed_by, period, rating, feedback) VALUES (?, ?, ?, ?, ?)',
      [user_id, req.user.id, period.trim(), rating, feedback?.trim() || null]
    );
    res.json({ msg: 'Performance review submitted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PUT /:id  — update review (admin) ─────────────────────────────────────
router.put('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { rating, feedback, period } = req.body;
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }
    await pool.query(
      `UPDATE performance SET
         rating   = COALESCE(?, rating),
         feedback = COALESCE(?, feedback),
         period   = COALESCE(?, period)
       WHERE id = ?`,
      [rating, feedback?.trim() ?? null, period?.trim() ?? null, req.params.id]
    );
    res.json({ msg: 'Review updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── DELETE /:id  — delete review (admin) ──────────────────────────────────
router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM performance WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
