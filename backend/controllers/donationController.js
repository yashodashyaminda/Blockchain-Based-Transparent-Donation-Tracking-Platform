const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

/**
 * @desc    Log a new donation and update the campaign raised amount
 * @route   POST /api/donations
 * @access  Public / Private (Donor or Web3 Wallet)
 */
exports.createDonation = async (req, res) => {
  const { campaignId, amount, transactionHash, donorAddress } = req.body;

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

    // 3. Resolve donor profile ID (from auth middleware or wallet address)
    let donorId = req.user ? req.user._id : null;
    if (!donorId && donorAddress) {
      let donorObj = await User.findOne({ walletAddress: { $regex: new RegExp(`^${donorAddress}$`, "i") } });
      if (!donorObj) {
        donorObj = await User.create({
          name: `Donor ${donorAddress.slice(0, 6)}`,
          email: `${donorAddress.toLowerCase()}@donor.eth`,
          walletAddress: donorAddress,
          role: 'Donor',
          password: 'web3_donor_pass_2026'
        });
      }
      donorId = donorObj._id;
    }

    if (!donorId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either authentication token or valid donor walletAddress',
      });
    }

    // 4. Create the donation transaction log
    const donation = await Donation.create({
      campaignId,
      donorId,
      amount: Number(amount),
      transactionHash,
    });

    // 5. Update the campaign's total raised amount
    campaign.raisedAmount += Number(amount);

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
      .sort({ date: -1 });

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
 * @desc    Get all donations made by a specific wallet address
 * @route   GET /api/donations/wallet/:address
 * @access  Public
 */
exports.getDonationsByWallet = async (req, res) => {
  try {
    const address = req.params.address;
    const donorObj = await User.findOne({ walletAddress: { $regex: new RegExp(`^${address}$`, "i") } });
    if (!donorObj) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const donations = await Donation.find({ donorId: donorObj._id })
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
    console.error('Get Wallet Donations Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while retrieving wallet donation ledger',
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

/**
 * @desc    Get all donations (Admin only / Public read)
 * @route   GET /api/donations
 * @access  Public
 */
exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donorId', 'name email walletAddress')
      .populate('campaignId', 'title description targetAmount raisedAmount status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: donations.length,
      data: donations,
    });
  } catch (error) {
    console.error('Get All Donations Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching all donations ledger',
      error: error.message,
    });
  }
};
