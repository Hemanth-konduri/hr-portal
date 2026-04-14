const express = require('express');
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/announcements
// @desc    Create announcement
// @access  Private (Admin)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  const { title, content } = req.body;

  try {
    const announcement = new Announcement({
      title,
      content,
      postedBy: req.user.id,
    });

    await announcement.save();
    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/announcements
// @desc    Get announcements
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true }).populate('postedBy', 'name').sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update announcement
// @access  Private (Admin)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied' });
  }

  try {
    await Announcement.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Announcement removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;