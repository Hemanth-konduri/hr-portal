const express = require('express');
const Leave = require('../models/Leave');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/leaves
// @desc    Apply for leave
// @access  Private
router.post('/', auth, async (req, res) => {
  const { startDate, endDate, reason } = req.body;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    const user = await User.findById(req.user.id);
    if (days > user.leaveBalance.casual) {
      return res.status(400).json({ msg: 'Insufficient leave balance' });
    }

    const leave = new Leave({
      employee: req.user.id,
      type: 'casual',
      startDate,
      endDate,
      reason,
      days,
    });

    await leave.save();
    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/leaves
// @desc    Get leave requests
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/leaves/all
// @desc    Get all leave requests (Admin)
// @access  Private (Admin)
router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const leaves = await Leave.find().populate('employee', 'name employeeId').sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave (Admin)
// @access  Private (Admin)
router.put('/:id/approve', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) {
      return res.status(404).json({ msg: 'Leave not found' });
    }

    leave.status = 'approved';
    leave.approvedBy = req.user.id;
    leave.approvalDate = new Date();

    // Update leave balance
    const user = await User.findById(leave.employee._id);
    user.leaveBalance.casual -= leave.days;
    await user.save();

    await leave.save();
    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave (Admin)
// @access  Private (Admin)
router.put('/:id/reject', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  const { reason } = req.body;

  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ msg: 'Leave not found' });
    }

    leave.status = 'rejected';
    leave.rejectionReason = reason;

    await leave.save();
    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;