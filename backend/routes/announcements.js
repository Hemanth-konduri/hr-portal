const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// ── GET /  — list announcements (role-filtered, expiry-aware) ──────────────
router.get('/', async (req, res) => {
  try {
    const { category, priority, pinned } = req.query;
    const role = req.user.role;

    let query = `
      SELECT
        a.*,
        u.full_name  AS author,
        u.role       AS author_role,
        (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id) AS read_count,
        EXISTS(
          SELECT 1 FROM announcement_reads ar2
          WHERE ar2.announcement_id = a.id AND ar2.user_id = ?
        ) AS is_read_by_me
      FROM announcements a
      JOIN users u ON a.posted_by = u.id
      WHERE a.is_active = TRUE
        AND a.deleted_at IS NULL
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
        AND (
          a.target_audience = 'all'
          OR (a.target_audience = 'employees' AND ? = 'employee')
          OR (a.target_audience = 'admins'    AND ? IN ('admin','super_admin'))
        )
    `;
    const params = [req.user.id, role, role];

    if (category) { query += ' AND a.category = ?';  params.push(category); }
    if (priority) { query += ' AND a.priority = ?';  params.push(priority); }
    if (pinned === 'true') { query += ' AND a.pinned = TRUE'; }

    query += ' ORDER BY a.pinned DESC, a.priority DESC, a.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /all  — admin view (includes inactive/expired/deleted) ─────────────
router.get('/all', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.*,
        u.full_name AS author,
        (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id) AS read_count
      FROM announcements a
      JOIN users u ON a.posted_by = u.id
      WHERE a.deleted_at IS NULL
      ORDER BY a.pinned DESC, a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /stats  — admin dashboard stats ───────────────────────────────────
router.get('/stats', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*)                                          AS total,
        SUM(is_active = TRUE AND deleted_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())) AS active,
        SUM(pinned = TRUE AND is_active = TRUE)           AS pinned,
        SUM(priority = 'urgent')                          AS urgent,
        SUM(expires_at IS NOT NULL AND expires_at < NOW()
            AND deleted_at IS NULL)                       AS expired
      FROM announcements
    `);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /  — create announcement ─────────────────────────────────────────
router.post('/', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      title, content,
      priority = 'normal',
      category = 'general',
      pinned   = false,
      expires_at = null,
      target_audience = 'all',
    } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ msg: 'Title and content are required' });
    }

    await pool.query(
      `INSERT INTO announcements
         (title, content, posted_by, priority, category, pinned, expires_at, target_audience)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), content.trim(), req.user.id, priority, category, pinned, expires_at, target_audience]
    );
    res.json({ msg: 'Announcement created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PUT /:id  — edit announcement ─────────────────────────────────────────
router.put('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const {
      title, content, priority, category,
      pinned, expires_at, target_audience, is_active,
    } = req.body;

    await pool.query(
      `UPDATE announcements SET
         title = COALESCE(?, title),
         content = COALESCE(?, content),
         priority = COALESCE(?, priority),
         category = COALESCE(?, category),
         pinned   = COALESCE(?, pinned),
         expires_at = ?,
         target_audience = COALESCE(?, target_audience),
         is_active = COALESCE(?, is_active)
       WHERE id = ? AND deleted_at IS NULL`,
      [title, content, priority, category, pinned, expires_at ?? null, target_audience, is_active, req.params.id]
    );
    res.json({ msg: 'Announcement updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PATCH /:id/toggle-pin  ─────────────────────────────────────────────────
router.patch('/:id/toggle-pin', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE announcements SET pinned = NOT pinned WHERE id = ?',
      [req.params.id]
    );
    res.json({ msg: 'Pin toggled' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PATCH /:id/toggle-active  ─────────────────────────────────────────────
router.patch('/:id/toggle-active', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE announcements SET is_active = NOT is_active WHERE id = ?',
      [req.params.id]
    );
    res.json({ msg: 'Status toggled' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── DELETE /:id  — soft delete ────────────────────────────────────────────
router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE announcements SET deleted_at = NOW(), is_active = FALSE WHERE id = ?',
      [req.params.id]
    );
    res.json({ msg: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /:id/read  — mark as read ────────────────────────────────────────
router.post('/:id/read', async (req, res) => {
  try {
    await pool.query(
      `INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)`,
      [req.params.id, req.user.id]
    );
    res.json({ msg: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
