const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  checkIn,
  checkOut,
  getEmployeeAttendance,
  getAllAttendance
} = require('../controllers/attendanceController');

// All endpoints require authentication
router.use(authenticate);

// Employee actions
router.post('/checkin', authorize('employee', 'admin', 'super_admin'), checkIn);
router.post('/checkout', authorize('employee', 'admin', 'super_admin'), checkOut);
router.get('/', getEmployeeAttendance); // Own attendance

// Admin actions
router.get('/all', authorize('super_admin', 'admin'), getAllAttendance);

module.exports = router;