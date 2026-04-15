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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.use(authenticate);

// ── GET /my  — employee's own documents ───────────────────────────────────
router.get('/my', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*,
              v.full_name AS verified_by_name
       FROM documents d
       LEFT JOIN users v ON d.verified_by = v.id
       WHERE d.user_id = ?
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── GET /all  — all documents (admin) ─────────────────────────────────────
router.get('/all', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { user_id, status, document_type } = req.query;
    let query = `
      SELECT d.*,
             u.full_name AS owner_name, u.employee_id,
             v.full_name AS verified_by_name
      FROM documents d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN users v ON d.verified_by = v.id
      WHERE 1=1
    `;
    const params = [];
    if (user_id)       { query += ' AND d.user_id = ?';              params.push(user_id); }
    if (status)        { query += ' AND d.verification_status = ?';  params.push(status); }
    if (document_type) { query += ' AND d.document_type = ?';        params.push(document_type); }
    query += ' ORDER BY d.created_at DESC';
    const [rows] = await pool.query(query, params);
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
        COUNT(*)                                    AS total,
        SUM(verification_status = 'pending')        AS pending,
        SUM(verification_status = 'verified')       AS verified,
        SUM(verification_status = 'rejected')       AS rejected,
        SUM(verification_status = 'expired')        AS expired,
        COUNT(DISTINCT user_id)                     AS employees_with_docs
      FROM documents
    `);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /  — upload document ──────────────────────────────────────────────
router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'File is required' });
    const { document_type, expiry_date } = req.body;
    if (!document_type) return res.status(400).json({ msg: 'document_type is required' });

    // Admins can upload on behalf of an employee
    let targetUser = req.user.id;
    if (req.body.user_id && ['admin', 'super_admin'].includes(req.user.role)) {
      targetUser = req.body.user_id;
    }

    const file_path = `/uploads/documents/${req.file.filename}`;
    await pool.query(
      `INSERT INTO documents
         (user_id, document_type, file_name, file_path, uploaded_by, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [targetUser, document_type, req.file.originalname, file_path,
       req.user.id, expiry_date || null]
    );
    res.json({ msg: 'Document uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PATCH /:id/verify  — verify a document ────────────────────────────────
router.patch('/:id/verify', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { status, hr_notes } = req.body;
    const allowed = ['verified', 'rejected', 'expired', 'pending'];
    if (!allowed.includes(status)) return res.status(400).json({ msg: 'Invalid status' });

    await pool.query(
      `UPDATE documents SET
         verification_status = ?,
         verified_by  = ?,
         verified_at  = NOW(),
         hr_notes     = COALESCE(?, hr_notes)
       WHERE id = ?`,
      [status, req.user.id, hr_notes || null, req.params.id]
    );
    res.json({ msg: `Document marked as ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── PATCH /:id/notes  — add/update HR notes ───────────────────────────────
router.patch('/:id/notes', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { hr_notes } = req.body;
    await pool.query('UPDATE documents SET hr_notes = ? WHERE id = ?', [hr_notes, req.params.id]);
    res.json({ msg: 'Notes updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── DELETE /:id  — delete document ────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ msg: 'Document not found' });

    const doc = rows[0];
    // Employee can only delete their own; admin can delete any
    if (req.user.role === 'employee' && doc.user_id !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Delete physical file
    const abs = path.join(__dirname, '..', doc.file_path);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);

    await pool.query('DELETE FROM documents WHERE id = ?', req.params.id);
    res.json({ msg: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
