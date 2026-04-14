const express = require('express');
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// @route   POST /api/documents
// @desc    Upload document
// @access  Private
router.post('/', [auth, upload.single('document')], async (req, res) => {
  const { type, name } = req.body;

  try {
    const document = new Document({
      employee: req.user.id,
      type,
      name,
      fileUrl: req.file.path,
      uploadedBy: req.user.id,
    });

    await document.save();
    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/documents
// @desc    Get documents
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ employee: req.user.id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/documents/all
// @desc    Get all documents (Admin)
// @access  Private (Admin)
router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const documents = await Document.find().populate('employee', 'name employeeId').sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;