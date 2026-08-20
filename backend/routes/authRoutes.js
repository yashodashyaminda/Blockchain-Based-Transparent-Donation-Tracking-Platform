const express = require('express');
const router = express.Router();
const {
    register,
    login,
    forgotPassword,
    verifyNGO,
    getUsers
} = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware');

/**
 * Authentication Routes definition
 * Root base URL: /api/auth
 */

// Route to register new users (Donors or NGOs) - Supports file upload for NGO registration certificate
router.post('/register', upload.single('file'), register);

// Route to login existing users
router.post('/login', login);

// Route to request password reset token/mail stub
router.post('/forgotpassword', forgotPassword);

// 👉 Admin Route: Approve / Verify pending NGO account
router.put('/verify-ngo/:id', verifyToken, checkRole(['Admin']), verifyNGO);

// 👉 Admin Route: Get all users
router.get('/users', verifyToken, checkRole(['Admin']), getUsers);

router.put('/reject-ngo/:id', verifyToken, checkRole(['Admin']), rejectNGO);

router.put('/resubmit-document', verifyToken, checkRole(['NGO']), upload.single('file'), resubmitDocument);

module.exports = router;