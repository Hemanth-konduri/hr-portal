const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  applyLeave,
  getEmployeeLeaves,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveBalance,
  cancelLeave,
  getLeaveStats,
} = require('../controllers/leaveController');

router.use(authenticate);

// ── Static paths first (must come before /:id routes) ────────
router.get('/all',     authorize('super_admin', 'admin'), getAllLeaves);
router.get('/stats',   authorize('super_admin', 'admin'), getLeaveStats);
router.get('/balance', authorize('employee', 'admin', 'super_admin'), getLeaveBalance);
router.get('/my',      authorize('employee'), getEmployeeLeaves);
router.get('/',        authorize('employee'), getEmployeeLeaves);
router.post('/apply',  authorize('employee'), applyLeave);

// ── Dynamic :id routes last ───────────────────────────────────
router.delete('/:id/cancel', authorize('employee'), cancelLeave);
router.put('/:id/status',    authorize('super_admin', 'admin'), updateLeaveStatus);

module.exports = router;
