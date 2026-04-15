const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  applyLeave,
  getEmployeeLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveBalance
} = require('../controllers/leaveController');

router.use(authenticate);

// Employee actions
router.post('/apply', authorize('employee'), applyLeave);
router.get('/', authorize('employee'), getEmployeeLeaves);
router.get('/balance', authorize('employee', 'admin', 'super_admin'), getLeaveBalance);

// Admin actions
router.get('/all', authorize('super_admin', 'admin'), getAllLeaves);
router.put('/:id/status', authorize('super_admin', 'admin'), updateLeaveStatus);

module.exports = router;