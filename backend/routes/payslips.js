const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const {
  setSalaryStructure,
  getSalaryStructure,
  generatePayslip,
  getMyPayslips,
  getAllPayslips
} = require('../controllers/payslipController');

// Multer setup for payslip PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../uploads/payslips');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  }
});
const upload = multer({ storage: storage });

router.use(authenticate);

// Admin Actions
router.post('/structure', authorize('super_admin', 'admin'), setSalaryStructure);
router.get('/structure/:user_id', authorize('super_admin', 'admin'), getSalaryStructure);
router.get('/all', authorize('super_admin', 'admin'), getAllPayslips);
router.post('/upload', authorize('super_admin', 'admin'), upload.single('payslip'), generatePayslip);

// Employee Actions
router.get('/my', authorize('employee', 'admin', 'super_admin'), getMyPayslips);

module.exports = router;