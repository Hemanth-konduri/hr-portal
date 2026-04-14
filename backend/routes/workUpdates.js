const express = require('express');
const WorkUpdate = require('../models/WorkUpdate');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/work-updates
// @desc    Submit work update
// @access  Private
router.post('/', auth, async (req, res) => {
  const { tasks, notes } = req.body;

  try {
    const workUpdate = new WorkUpdate({
      employee: req.user.id,
      tasks,
      notes,
    });

    await workUpdate.save();
    res.json(workUpdate);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/work-updates
// @desc    Get work updates (Admin)
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const workUpdates = await WorkUpdate.find().populate('employee', 'name employeeId').sort({ date: -1 });
    res.json(workUpdates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/work-updates/my
// @desc    Get my work updates
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const workUpdates = await WorkUpdate.find({ employee: req.user.id }).sort({ date: -1 });
    res.json(workUpdates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;