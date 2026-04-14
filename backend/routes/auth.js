const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  setupSuperAdmin,
  getSetupStatus,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
} = require('../controllers/authController');

// Public routes
router.get('/setup-status', getSetupStatus);          // check if setup is done
router.post('/setup', setupSuperAdmin);               // one-time super admin registration
router.post('/login', login);                         // login for all roles
router.post('/forgot-password', forgotPassword);      // send OTP to email
router.post('/reset-password', resetPassword);        // verify OTP + set new password

// Protected routes
router.get('/me', authenticate, getMe);                             // get logged in user
router.post('/change-password', authenticate, changePassword);      // forced + voluntary password change

module.exports = router;
