const express = require('express');
const router = express.Router();
const {
  createDonation,
  getCampaignDonations,
  getDonationsByWallet,
  getMyDonations,
  getDonations,
} = require('../controllers/donationController');

/**
 * Donation Routes definition
 * Root base URL: /api/donations
 */

// Log a new donation transaction (Donor or Web3 Wallet)
router.route('/').post(createDonation);

// Fetch all donations
router.route('/').get(getDonations);

// Fetch all donations logged for a specific wallet address
router.route('/wallet/:address').get(getDonationsByWallet);

// Private route: Fetch all donations logged by the active/logged-in donor
router.route('/my-donations').get(getMyDonations);

// Public route: Fetch all donations processed for a specific campaign ID
router.route('/campaign/:campaignId').get(getCampaignDonations);

module.exports = router;
