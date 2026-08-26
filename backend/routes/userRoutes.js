const express = require('express');
const router = express.Router();
const { bindWallet } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

/**
 * User Routes definition
 * Root base URL: /api/users
 */

// Protected route to bind connected Web3 wallet address to authenticated user profile
router.put('/bind-wallet', verifyToken, bindWallet);

module.exports = router;
