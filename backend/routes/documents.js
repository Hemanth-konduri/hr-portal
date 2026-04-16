const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.use(authenticate);

// ── Detect which extra columns exist (cached after first call) ────────────
let _cols = null;
async function getCols() {
  if (_cols) return _cols;
  try {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'documents'`
    );
    const names = rows.map(r => r.COLUMN_NAME);
    _cols = {
      verification_status: names.includes('verification_status'),
      verified_by:         names.includes('verified_by'),
      verified_at:         names.includes('verified_at'),
      hr_notes:            names.includes('hr_notes'),
      expiry_date:         names.includes('expiry_date'),
    };
  } catch {
    _cols = { verification_status: false, verified_by: false, verified_at: false, hr_notes: false, expiry_date: false };
  }
  return _cols;
}

// Build extra SELECT columns with safe fallbacks
function extraSelect(cols) {
  return [
    cols.verification_status ? 'd.verification_status' : "'pending' AS verification_status",
    cols.verified_by         ? 'd.verified_by'         : 'NULL AS verified_by',
    cols.hr_notes            ? 'd.hr_notes'            : 'NULL AS hr_notes',
    cols.expiry_date         ? 'd.expiry_date'         : 'NULL AS expiry_date',
  ].join(', ');
}

// ── GET /my ───────────────────────────────────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const cols = await getCols();
    const verifiedJoin = cols.verified_by ? 'LEFT JOIN users v ON d.verified_by = v.id' : '';
    const verifiedName = cols.verified_by ? 'v.full_name AS verified_by_name,' : 'NULL AS verified_by_name,';

    const [rows] = await pool.query(
      `SELECT d.id, d.user_id, d.document_type, d.file_name, d.file_path,
              d.uploaded_by, d.created_at,
              ${verifiedName}
              ${extraSelect(cols)}
       FROM documents d
       ${verifiedJoin}
       WHERE d.user_id = ?
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /all ──────────────────────────────────────────────────────────────
router.get('/all', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getCols();
    const verifiedJoin = cols.verified_by ? 'LEFT JOIN users v ON d.verified_by = v.id' : '';
    const verifiedName = cols.verified_by ? 'v.full_name AS verified_by_name,' : 'NULL AS verified_by_name,';

    const { user_id, status, document_type } = req.query;
    let query = `
      SELECT d.id, d.user_id, d.document_type, d.file_name, d.file_path,
             d.uploaded_by, d.created_at,
             u.full_name AS owner_name, u.employee_id,
             ${verifiedName}
             ${extraSelect(cols)}
      FROM documents d
      JOIN users u ON d.user_id = u.id
      ${verifiedJoin}
      WHERE 1=1
    `;
    const params = [];
    if (user_id)       { query += ' AND d.user_id = ?';       params.push(user_id); }
    if (document_type) { query += ' AND d.document_type = ?'; params.push(document_type); }
    if (status && cols.verification_status) {
      query += ' AND d.verification_status = ?';
      params.push(status);
    }
    query += ' ORDER BY d.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /stats ────────────────────────────────────────────────────────────
router.get('/stats', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getCols();
    let query;
    if (cols.verification_status) {
      query = `SELECT
        COUNT(*)                                    AS total,
        SUM(verification_status = 'pending')        AS pending,
        SUM(verification_status = 'verified')       AS verified,
        SUM(verification_status = 'rejected')       AS rejected,
        SUM(verification_status = 'expired')        AS expired,
        COUNT(DISTINCT user_id)                     AS employees_with_docs
      FROM documents`;
    } else {
      query = `SELECT
        COUNT(*)                AS total,
        COUNT(*)                AS pending,
        0                       AS verified,
        0                       AS rejected,
        0                       AS expired,
        COUNT(DISTINCT user_id) AS employees_with_docs
      FROM documents`;
    }
    const [[stats]] = await pool.query(query);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST / — upload ───────────────────────────────────────────────────────
router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'File is required' });

    const { document_type, expiry_date } = req.body;
    if (!document_type) return res.status(400).json({ msg: 'document_type is required' });

    let targetUser = req.user.id;
    if (req.body.user_id && ['admin', 'super_admin'].includes(req.user.role)) {
      targetUser = req.body.user_id;
    }

    const cols = await getCols();
    const file_path = `/uploads/documents/${req.file.filename}`;

    if (cols.expiry_date) {
      await pool.query(
        `INSERT INTO documents (user_id, document_type, file_name, file_path, uploaded_by, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [targetUser, document_type, req.file.originalname, file_path, req.user.id, expiry_date || null]
      );
    } else {
      await pool.query(
        `INSERT INTO documents (user_id, document_type, file_name, file_path, uploaded_by)
         VALUES (?, ?, ?, ?, ?)`,
        [targetUser, document_type, req.file.originalname, file_path, req.user.id]
      );
    }
    res.json({ msg: 'Document uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PATCH /:id/verify ─────────────────────────────────────────────────────
router.patch('/:id/verify', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getCols();
    if (!cols.verification_status) {
      return res.status(400).json({ msg: 'Run documents_migration.sql to enable verification' });
    }
    const { status, hr_notes } = req.body;
    const allowed = ['verified', 'rejected', 'expired', 'pending'];
    if (!allowed.includes(status)) return res.status(400).json({ msg: 'Invalid status' });

    const setClauses = ['verification_status = ?', 'verified_by = ?', 'verified_at = NOW()'];
    const params = [status, req.user.id];
    if (cols.hr_notes && hr_notes) {
      setClauses.push('hr_notes = ?');
      params.push(hr_notes);
    }
    params.push(req.params.id);

    await pool.query(
      `UPDATE documents SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );
    res.json({ msg: `Document marked as ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PATCH /:id/notes ──────────────────────────────────────────────────────
router.patch('/:id/notes', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const cols = await getCols();
    if (!cols.hr_notes) {
      return res.status(400).json({ msg: 'Run documents_migration.sql to enable HR notes' });
    }
    const { hr_notes } = req.body;
    await pool.query('UPDATE documents SET hr_notes = ? WHERE id = ?', [hr_notes, req.params.id]);
    res.json({ msg: 'Notes updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── DELETE /:id ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ msg: 'Document not found' });

    const doc = rows[0];
    if (req.user.role === 'employee' && doc.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const abs = path.join(__dirname, '..', doc.file_path);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);

    await pool.query('DELETE FROM documents WHERE id = ?', [req.params.id]);
    res.json({ msg: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
