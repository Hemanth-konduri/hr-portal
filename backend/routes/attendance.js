const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/attendance/checkin
// @desc    Check in
// @access  Private
router.post('/checkin', auth, async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      employee: req.user.id,
      date: today,
    });

    if (attendance && attendance.checkIn.time) {
      return res.status(400).json({ msg: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({
        employee: req.user.id,
        date: today,
      });
    }

    attendance.checkIn = {
      time: new Date(),
      location: { latitude, longitude },
    };

    // Check if late (after 9 AM)
    const checkInTime = new Date(attendance.checkIn.time);
    const lateTime = new Date(today);
    lateTime.setHours(9, 0, 0, 0);

    if (checkInTime > lateTime) {
      attendance.status = 'late';
      attendance.lop = true;
    } else {
      attendance.status = 'present';
    }

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/attendance/checkout
// @desc    Check out
// @access  Private
router.post('/checkout', auth, async (req, res) => {
  const { latitude, longitude } = req.body;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: today,
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({ msg: 'Not checked in today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: { latitude, longitude },
    };

    // Calculate working hours
    const checkInTime = new Date(attendance.checkIn.time);
    const checkOutTime = new Date(attendance.checkOut.time);
    const workingHours = (checkOutTime - checkInTime) / (1000 * 60 * 60); // hours

    attendance.workingHours = workingHours;

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find({ employee: req.user.id }).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/attendance/all
// @desc    Get all attendance records (Admin)
// @access  Private (Admin)
router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const attendance = await Attendance.find().populate('employee', 'name employeeId').sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;