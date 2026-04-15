const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  checkIn, checkOut,
  getEmployeeAttendance, getMyAttendanceSummary,
  getAllAttendance, getAttendanceSummary, getEmployeeMonthlySummary,
} = require('../controllers/attendanceController');

router.use(authenticate);

// ── Employee ──────────────────────────────────────────────────
router.post('/checkin',  authorize('employee', 'admin', 'super_admin'), checkIn);
router.post('/checkout', authorize('employee', 'admin', 'super_admin'), checkOut);
router.get('/my',        getEmployeeAttendance);       // own records with filters
router.get('/my/summary', getMyAttendanceSummary);     // own monthly summary

// ── Admin / Super Admin ───────────────────────────────────────
router.get('/all',             authorize('super_admin', 'admin'), getAllAttendance);
router.get('/summary',         authorize('super_admin', 'admin'), getAttendanceSummary);
router.get('/monthly-summary', authorize('super_admin', 'admin'), getEmployeeMonthlySummary);

module.exports = router;
