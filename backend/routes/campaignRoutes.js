const express = require('express');
const router = express.Router();
const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  approveCampaign,
} = require('../controllers/campaignController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

/**
 * Campaign Routes definition
 * Root base URL: /api/campaigns
 */

// Public route: Retrieve all campaigns
router.get('/', getCampaigns);

// Private route: Create a campaign (Only NGO role)
router.post('/', verifyToken, checkRole(['NGO', 'Admin']), createCampaign);

// CRITICAL ROUTE PRIORITY: 
// Place the specific admin approval route BEFORE any generic /:id route 
// to prevent Express from misinterpreting "approve" as a parameter.
router.put('/:id/approve', verifyToken, checkRole(['Admin']), approveCampaign);

// Public route: Retrieve campaign details by ID
router.get('/:id', getCampaignById);

// Private route: Update and Delete campaign (Only NGO owner or Admin)
router.put('/:id', verifyToken, checkRole(['NGO', 'Admin']), updateCampaign);
router.delete('/:id', verifyToken, checkRole(['NGO', 'Admin']), deleteCampaign);

module.exports = router;