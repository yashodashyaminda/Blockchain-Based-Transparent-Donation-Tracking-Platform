const express = require('express');
const router = express.Router();
const { register, login, forgotPassword } = require('../controllers/authController');

/**
 * Authentication Routes definition
 * Root base URL: /api/auth
 */

// Route to register new users (Donors or NGOs)
router.post('/register', register);

// Route to login existing users
router.post('/login', login);

// Route to request password reset token/mail stub
router.post('/forgotpassword', forgotPassword);

module.exports = router;
