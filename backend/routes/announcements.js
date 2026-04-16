const express = require('express');
const router  = express.Router();
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// ── Column detection (cached) ─────────────────────────────────────────────
let annCols = null;
async function getAnnCols() {
  if (annCols !== null) return annCols;
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'announcements'`
    );
    const names = cols.map(c => c.COLUMN_NAME);
    annCols = {
      priority:        names.includes('priority'),
      category:        names.includes('category'),
      pinned:          names.includes('pinned'),
      expires_at:      names.includes('expires_at'),
      target_audience: names.includes('target_audience'),
      deleted_at:      names.includes('deleted_at'),
    };
  } catch {
    annCols = { priority: false, category: false, pinned: false, expires_at: false, target_audience: false, deleted_at: false };
  }
  return annCols;
}

let readsTableExists = null;
async function hasReadsTable() {
  if (readsTableExists !== null) return readsTableExists;
  try {
    const [rows] = await pool.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'announcement_reads'`
    );
    readsTableExists = rows.length > 0;
  } catch {
    readsTableExists = false;
  }
  return readsTableExists;
}

// ── GET /  — list active announcements ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cols  = await getAnnCols();
    const reads = await hasReadsTable();

    const readCount  = reads ? `(SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id)` : '0';
    const isReadByMe = reads ? `EXISTS(SELECT 1 FROM announcement_reads ar2 WHERE ar2.announcement_id = a.id AND ar2.user_id = ${req.user.id})` : '0';

    const extraSelect = [
      cols.priority        ? 'a.priority'        : "'normal' AS priority",
      cols.category        ? 'a.category'        : "'general' AS category",
      cols.pinned          ? 'a.pinned'          : '0 AS pinned',
      cols.expires_at      ? 'a.expires_at'      : 'NULL AS expires_at',
      cols.target_audience ? 'a.target_audience' : "'all' AS target_audience",
      `${readCount} AS read_count`,
      `${isReadByMe} AS is_read_by_me`,
    ].join(', ');

    let where = 'WHERE a.is_active = TRUE';
    if (cols.deleted_at)      where += ' AND a.deleted_at IS NULL';
    if (cols.expires_at)      where += ' AND (a.expires_at IS NULL OR a.expires_at > NOW())';
    if (cols.target_audience) {
      const role = req.user.role;
      where += ` AND (a.target_audience = 'all'
        OR (a.target_audience = 'employees' AND '${role}' = 'employee')
        OR (a.target_audience = 'admins' AND '${role}' IN ('admin','super_admin')))`;
    }

    const orderBy = cols.pinned
      ? 'ORDER BY a.pinned DESC, a.created_at DESC'
      : 'ORDER BY a.created_at DESC';

    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.content, a.is_active, a.posted_by, a.created_at, a.updated_at,
              u.full_name AS author, u.role AS author_role,
              ${extraSelect}
       FROM announcements a
       JOIN users u ON a.posted_by = u.id
       ${where}
       ${orderBy}`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /all  — admin view ─────────────────────────────────────────────────
router.get('/all', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols  = await getAnnCols();
    const reads = await hasReadsTable();

    const readCount = reads ? `(SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id)` : '0';

    const extraSelect = [
      cols.priority        ? 'a.priority'        : "'normal' AS priority",
      cols.category        ? 'a.category'        : "'general' AS category",
      cols.pinned          ? 'a.pinned'          : '0 AS pinned',
      cols.expires_at      ? 'a.expires_at'      : 'NULL AS expires_at',
      cols.target_audience ? 'a.target_audience' : "'all' AS target_audience",
      cols.deleted_at      ? 'a.deleted_at'      : 'NULL AS deleted_at',
      `${readCount} AS read_count`,
    ].join(', ');

    let where = 'WHERE 1=1';
    if (cols.deleted_at) where += ' AND a.deleted_at IS NULL';

    const orderBy = cols.pinned
      ? 'ORDER BY a.pinned DESC, a.created_at DESC'
      : 'ORDER BY a.created_at DESC';

    const [rows] = await pool.query(
      `SELECT a.id, a.title, a.content, a.is_active, a.posted_by, a.created_at, a.updated_at,
              u.full_name AS author,
              ${extraSelect}
       FROM announcements a
       JOIN users u ON a.posted_by = u.id
       ${where}
       ${orderBy}`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /stats ─────────────────────────────────────────────────────────────
router.get('/stats', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getAnnCols();

    const activeExpr = cols.deleted_at
      ? `SUM(is_active = TRUE AND deleted_at IS NULL AND (${cols.expires_at ? 'expires_at IS NULL OR expires_at > NOW()' : '1=1'}))`
      : 'SUM(is_active = TRUE)';

    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*)          AS total,
        ${activeExpr}     AS active,
        ${cols.pinned   ? 'SUM(pinned = TRUE AND is_active = TRUE)' : '0'} AS pinned,
        ${cols.priority ? "SUM(priority = 'urgent')" : '0'}               AS urgent,
        ${cols.expires_at && cols.deleted_at
          ? 'SUM(expires_at IS NOT NULL AND expires_at < NOW() AND deleted_at IS NULL)'
          : '0'} AS expired
      FROM announcements
    `);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST / — create ────────────────────────────────────────────────────────
router.post('/', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getAnnCols();
    const { title, content, priority = 'normal', category = 'general',
            pinned = false, expires_at = null, target_audience = 'all' } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ msg: 'Title and content are required' });
    }

    if (cols.priority) {
      await pool.query(
        `INSERT INTO announcements (title, content, posted_by, priority, category, pinned, expires_at, target_audience)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title.trim(), content.trim(), req.user.id, priority, category, pinned ? 1 : 0, expires_at, target_audience]
      );
    } else {
      await pool.query(
        'INSERT INTO announcements (title, content, posted_by) VALUES (?, ?, ?)',
        [title.trim(), content.trim(), req.user.id]
      );
    }
    res.json({ msg: 'Announcement created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PUT /:id — edit ────────────────────────────────────────────────────────
router.put('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getAnnCols();
    const { title, content, priority, category, pinned, expires_at, target_audience, is_active } = req.body;

    if (cols.priority) {
      await pool.query(
        `UPDATE announcements SET
           title = COALESCE(?, title), content = COALESCE(?, content),
           priority = COALESCE(?, priority), category = COALESCE(?, category),
           pinned = COALESCE(?, pinned), expires_at = ?,
           target_audience = COALESCE(?, target_audience),
           is_active = COALESCE(?, is_active)
         WHERE id = ?`,
        [title, content, priority, category, pinned != null ? (pinned ? 1 : 0) : null,
         expires_at ?? null, target_audience, is_active, req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE announcements SET
           title = COALESCE(?, title), content = COALESCE(?, content),
           is_active = COALESCE(?, is_active)
         WHERE id = ?`,
        [title, content, is_active, req.params.id]
      );
    }
    res.json({ msg: 'Announcement updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

router.patch('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getAnnCols();
    const { title, content, priority, category, pinned, expires_at, target_audience, is_active } = req.body;

    if (cols.priority) {
      await pool.query(
        `UPDATE announcements SET
           title = COALESCE(?, title), content = COALESCE(?, content),
           priority = COALESCE(?, priority), category = COALESCE(?, category),
           pinned = COALESCE(?, pinned), expires_at = COALESCE(?, expires_at),
           target_audience = COALESCE(?, target_audience),
           is_active = COALESCE(?, is_active)
         WHERE id = ?`,
        [title, content, priority, category, pinned != null ? (pinned ? 1 : 0) : null,
         expires_at ?? null, target_audience, is_active, req.params.id]
      );
    } else {
      await pool.query(
        `UPDATE announcements SET
           title = COALESCE(?, title), content = COALESCE(?, content),
           is_active = COALESCE(?, is_active)
         WHERE id = ?`,
        [title, content, is_active, req.params.id]
      );
    }
    res.json({ msg: 'Announcement updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PATCH /:id/toggle-pin ─────────────────────────────────────────────────
router.patch('/:id/toggle-pin', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getAnnCols();
    if (!cols.pinned) return res.json({ msg: 'Pin not supported without migration' });
    await pool.query('UPDATE announcements SET pinned = NOT pinned WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Pin toggled' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PATCH /:id/toggle-active ──────────────────────────────────────────────
router.patch('/:id/toggle-active', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    await pool.query('UPDATE announcements SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Status toggled' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────
router.delete('/:id', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getAnnCols();
    if (cols.deleted_at) {
      await pool.query('UPDATE announcements SET deleted_at = NOW(), is_active = FALSE WHERE id = ?', [req.params.id]);
    } else {
      await pool.query('UPDATE announcements SET is_active = FALSE WHERE id = ?', [req.params.id]);
    }
    res.json({ msg: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /:id/read ────────────────────────────────────────────────────────
router.post('/:id/read', async (req, res) => {
  try {
    const reads = await hasReadsTable();
    if (!reads) return res.json({ msg: 'Read tracking not available' });
    await pool.query(
      'INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)',
      [req.params.id, req.user.id]
    );
    res.json({ msg: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
