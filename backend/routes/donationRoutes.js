const express = require('express');
const router = express.Router();
const {
  createDonation,
  getCampaignDonations,
  getMyDonations,
} = require('../controllers/donationController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

/**
 * Donation Routes definition
 * Root base URL: /api/donations
 */

// Private route: Log a new donation transaction (Only Donor role)
router.route('/').post(verifyToken, checkRole(['Donor']), createDonation);

// Private route: Fetch all donations logged by the active/logged-in donor (Only Donor role)
router.route('/my-donations').get(verifyToken, checkRole(['Donor']), getMyDonations);

// Public route: Fetch all donations processed for a specific campaign ID
router.route('/campaign/:campaignId').get(getCampaignDonations);

module.exports = router;
