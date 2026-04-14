const express = require('express');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit feedback
// @access  Private
router.post('/', auth, async (req, res) => {
  const { type, responses } = req.body;

  try {
    const feedback = new Feedback({
      employee: req.user.id,
      type,
      responses,
    });

    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/feedback
// @desc    Get feedback (Admin)
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const feedback = await Feedback.find().populate('employee', 'name employeeId').sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;