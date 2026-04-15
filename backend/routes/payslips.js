const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const {
  setSalaryStructure, getSalaryStructure, getAllSalaryStructures,
  getPayrollStats, generatePayslip, getMyPayslips, getAllPayslips, deletePayslip,
} = require('../controllers/payslipController');

// Multer setup — PDF optional
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/payslips');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `payslip-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`);
  },
});
const upload = multer({ storage });

router.use(authenticate);

// Static paths first
router.get('/all',              authorize('super_admin', 'admin'), getAllPayslips);
router.get('/stats',            authorize('super_admin', 'admin'), getPayrollStats);
router.get('/structures',       authorize('super_admin', 'admin'), getAllSalaryStructures);
router.post('/structure',       authorize('super_admin', 'admin'), setSalaryStructure);
router.post('/generate',        authorize('super_admin', 'admin'), upload.single('payslip'), generatePayslip);
router.get('/my',               authorize('employee', 'admin', 'super_admin'), getMyPayslips);

// Dynamic :id routes last
router.get('/structure/:user_id', authorize('super_admin', 'admin'), getSalaryStructure);
router.delete('/:id',             authorize('super_admin', 'admin'), deletePayslip);

module.exports = router;