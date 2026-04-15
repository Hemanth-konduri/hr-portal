const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

router.use(authenticate);

// Upload document (Employee or Admin)
router.post('/', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: 'File is required' });
    const { document_type, user_id } = req.body;
    
    // Employees can only upload to their own user_id
    let targetUser = req.user.id;
    if (user_id && ['admin', 'super_admin'].includes(req.user.role)) {
      targetUser = user_id;
    }
    
    const file_path = `/uploads/documents/` + req.file.filename;

    await pool.query(
      'INSERT INTO documents (user_id, document_type, file_name, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?)',
      [targetUser, document_type, req.file.originalname, file_path, req.user.id]
    );

    res.json({ msg: 'Document uploaded successfully', file_path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's documents
router.get('/my', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all documents (Admin)
router.get('/all', authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, u.full_name as owner_name, u.employee_id 
      FROM documents d 
      JOIN users u ON d.user_id = u.id 
      ORDER BY d.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;