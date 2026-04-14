const express = require('express');
const multer = require('multer');
const path = require('path');
const Payslip = require('../models/Payslip');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/payslips/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// @route   POST /api/payslips
// @desc    Upload payslip
// @access  Private (Admin)
router.post('/', [auth, upload.single('payslip')], async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  const { employeeId, month, year, basicSalary, hra, allowances, lopDeduction } = req.body;

  try {
    const totalEarnings = basicSalary + hra + allowances;
    const totalDeductions = lopDeduction;
    const netSalary = totalEarnings - totalDeductions;

    const payslip = new Payslip({
      employee: employeeId,
      month,
      year,
      basicSalary,
      hra,
      allowances,
      totalEarnings,
      totalDeductions,
      netSalary,
      lopDeduction,
      uploadedBy: req.user.id,
      fileUrl: req.file.path,
    });

    await payslip.save();
    res.json(payslip);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/payslips
// @desc    Get payslips
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const payslips = await Payslip.find({ employee: req.user.id }).sort({ year: -1, month: -1 });
    res.json(payslips);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/payslips/all
// @desc    Get all payslips (Admin)
// @access  Private (Admin)
router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const payslips = await Payslip.find().populate('employee', 'name employeeId').sort({ year: -1, month: -1 });
    res.json(payslips);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;