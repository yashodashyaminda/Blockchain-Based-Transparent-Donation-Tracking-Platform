const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');

/**
 * @desc    Log a new donation and update the campaign raised amount
 * @route   POST /api/donations
 * @access  Private (Donor only)
 */
exports.createDonation = async (req, res) => {
  const { campaignId, amount, transactionHash } = req.body;

  try {
    // 1. Verify destination campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Destination campaign not found',
      });
    }

    // 2. Validate campaign status: Cannot donate to already completed projects
    if (campaign.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'This campaign is closed and does not accept further donations',
      });
    }

    // 3. Create the donation transaction log
    const donation = await Donation.create({
      campaignId,
      donorId: req.user._id,
      amount,
      transactionHash,
    });

    // 4. Update the campaign's total raised amount
    campaign.raisedAmount += Number(amount);

    // Dynamic State Transition: Switch campaign to "Funded" if target amount is reached
    if (campaign.raisedAmount >= campaign.targetAmount) {
      campaign.status = 'Funded';
    }

    await campaign.save();

    return res.status(201).json({
      success: true,
      message: 'Donation transaction logged and campaign metrics updated successfully',
      data: donation,
    });
  } catch (error) {
    console.error('Create Donation Error:', error);
    // Duplicate transaction hash check
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This transaction hash has already been registered on this platform',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while logging donation transaction',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all donations for a specific campaign
 * @route   GET /api/donations/campaign/:campaignId
 * @access  Public
 */
exports.getCampaignDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ campaignId: req.params.campaignId })
      .populate({
        path: 'donorId',
        select: 'name email walletAddress',
      })
      .sort({ date: -1 }); // Chronological order descending

    return res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error('Get Campaign Donations Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching campaign donations',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all donations made by the authenticated donor
 * @route   GET /api/donations/my-donations
 * @access  Private (Donor only)
 */
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donorId: req.user._id })
      .populate({
        path: 'campaignId',
        select: 'title targetAmount raisedAmount status coverImageIPFSHash',
      })
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error('Get My Donations Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving your donation ledger',
      error: error.message,
    });
  }
};
