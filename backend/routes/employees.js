const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUser,
} = require('../controllers/userController');

// All routes require authentication
router.use(authenticate);

// Super Admin + Admin can create users (controller handles role restriction internally)
router.post('/create', authorize('super_admin', 'admin'), createUser);

// Get all users — super_admin sees all, admin sees employees only
router.get('/', authorize('super_admin', 'admin'), getAllUsers);

// Get single user
router.get('/:id', authorize('super_admin', 'admin'), getUserById);

// Update user profile
router.put('/:id', authorize('super_admin', 'admin'), updateUser);

// Update user status (activate / deactivate / suspend)
router.patch('/:id/status', authorize('super_admin', 'admin'), updateUserStatus);

module.exports = router;
