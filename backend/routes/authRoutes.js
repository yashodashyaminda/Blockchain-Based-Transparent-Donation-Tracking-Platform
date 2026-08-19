const express = require('express');
const router = express.Router();
const {
    register,
    login,
    forgotPassword,
    verifyNGO // <-- Import new verify function
} = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware'); // <-- Auth middlewares

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

// 👉 Admin Route: Approve / Verify pending NGO account
router.put('/verify-ngo/:id', verifyToken, checkRole(['Admin']), verifyNGO);

module.exports = router;