const express = require('express');
const router = express.Router();
const {
  createProof,
  getCampaignProofs,
  approveProof,
} = require('../controllers/proofController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

/**
 * Proof Routes definition
 * Root base URL: /api/proofs
 */

// Private route: Submit new compliance/disbursement proof document (Only NGO role)
router.post('/', verifyToken, checkRole(['NGO']), createProof);

// Public route: Fetch all proofs submitted for a specific campaign ID
router.get('/campaign/:campaignId', getCampaignProofs);

// CRITICAL ROUTE PRIORITY:
// Place specific approval routes before generic resource IDs in case they are added later.
router.put('/:id/approve', verifyToken, checkRole(['Admin']), approveProof);

module.exports = router;