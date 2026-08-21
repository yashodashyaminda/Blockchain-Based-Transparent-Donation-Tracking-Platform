const express = require('express');
const router = express.Router();
const {
  createProof,
  getAllProofs,
  getCampaignProofs,
  updateProof,
  deleteProof,
  approveProof,
} = require('../controllers/proofController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerMiddleware');

/**
 * Proof Routes definition
 * Root base URL: /api/proofs
 */

// Private route: Submit new compliance/disbursement proof document (Only NGO role)
router.post('/', verifyToken, upload.single('file'), checkRole(['NGO']), createProof);

// Private route: Fetch all proofs across all campaigns (Admin only)
router.get('/', verifyToken, checkRole(['Admin']), getAllProofs);

// Public route: Fetch all proofs submitted for a specific campaign ID
router.get('/campaign/:campaignId', getCampaignProofs);

// CRITICAL ROUTE PRIORITY:
// Place specific approval routes before generic resource IDs in case they are added later.
router.put('/:id/approve', verifyToken, checkRole(['Admin']), approveProof);

// Private route: Update and Delete proof document (Only NGO owner or Admin)
router.put('/:id', verifyToken, upload.single('file'), checkRole(['NGO', 'Admin']), updateProof);
router.delete('/:id', verifyToken, checkRole(['NGO', 'Admin']), deleteProof);

module.exports = router;