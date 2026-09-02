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

const upload = require('../middleware/multerMiddleware');

/**
 * Campaign Routes definition
 * Root base URL: /api/campaigns
 */

// Public route: Retrieve all campaigns
router.get('/', getCampaigns);

// Private route: Create a campaign (Only NGO role)
router.post('/', verifyToken, upload.single('file'), checkRole(['NGO', 'Admin']), createCampaign);

// Public route: Retrieve campaign details by ID
router.get('/:id', getCampaignById);

// Private route: Update and Delete campaign (Only NGO owner or Admin)
router.put('/:id', verifyToken, upload.single('file'), checkRole(['NGO', 'Admin']), updateCampaign);
router.delete('/:id', verifyToken, checkRole(['NGO', 'Admin']), deleteCampaign);

module.exports = router;