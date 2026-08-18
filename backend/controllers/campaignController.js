const Campaign = require('../models/Campaign');

/**
 * @desc    Create a new fundraising campaign
 * @route   POST /api/campaigns
 * @access  Private (NGO only)
 */
// ෆයිල් එකේ උඩින්ම Campaign model එක import කරලා තියෙනවද බලන්න:
// const Campaign = require('../models/Campaign'); 

exports.createCampaign = async (req, res) => {
  try {
    // 1. Postman එකෙන් එවන Data ටික ගන්නවා
    const { title, description, targetAmount, coverImageIPFSHash } = req.body;

    // 2. අලුත් Campaign Object එකක් හදනවා (Database එකට යවන්න ලෑස්ති කරනවා)
    const newCampaign = new Campaign({
      title: title,
      description: description,
      targetAmount: targetAmount,
      coverImageIPFSHash: coverImageIPFSHash,
      ngoId: req.user.id, // මේක එන්නේ අර අපි Header එකේ යවපු Token එකෙන්!
      status: 'Pending' // Force Pending default status for admin approval flow
    });

    // 3. අනිවාර්යයෙන්ම MongoDB එකට Save කරන පේළිය (මේක තමයි වැදගත්ම)
    const savedCampaign = await newCampaign.save();

    // 4. Save වුණු ගමන් ඒ සම්පූර්ණ විස්තරේම ID එකත් එක්ක Postman එකට යවනවා
    res.status(201).json({
      message: "Campaign created successfully",
      campaign: savedCampaign
    });

  } catch (error) {
    // මොකක් හරි Database අවුලක් ගියොත් මෙතනින් පෙන්නනවා
    console.error("Save Error:", error);
    res.status(500).json({ message: "Error saving to database", error: error.message });
  }
};

/**
 * @desc    Get all campaigns in system
 * @route   GET /api/campaigns
 * @access  Public
 */
exports.getCampaigns = async (req, res) => {
  try {
    // Retrieve all records and populate NGO details (name, email, walletAddress)
    const campaigns = await Campaign.find().populate({
      path: 'ngoId',
      select: 'name email walletAddress isVerified',
    });

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    console.error('Get Campaigns Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching campaigns',
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single campaign by database ID
 * @route   GET /api/campaigns/:id
 * @access  Public
 */
exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate({
      path: 'ngoId',
      select: 'name email walletAddress isVerified',
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign record not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Get Campaign By ID Error:', error);
    // Handle invalid ObjectId format error separately
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Campaign record not found (invalid object ID representation)',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching campaign details',
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing campaign profile
 * @route   PUT /api/campaigns/:id
 * @access  Private (NGO creator or Admin only)
 */
exports.updateCampaign = async (req, res) => {
  try {
    let campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign record not found',
      });
    }

    // Authorization Guard: Check if user is the NGO owner of the campaign OR is an Admin
    const isOwner = campaign.ngoId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this campaign record',
      });
    }

    // Perform update operations
    campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Returns modified document
      runValidators: true, // Validates schema rules
    });

    return res.status(200).json({
      success: true,
      message: 'Campaign profile updated successfully',
      data: campaign,
    });
  } catch (error) {
    console.error('Update Campaign Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Campaign record not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during campaign update',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a campaign record from registry
 * @route   DELETE /api/campaigns/:id
 * @access  Private (NGO creator or Admin only)
 */
exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign record not found',
      });
    }

    // Authorization Guard: Check if user is the NGO owner of the campaign OR is an Admin
    const isOwner = campaign.ngoId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete this campaign record',
      });
    }

    // Remove the campaign document
    await Campaign.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully',
    });
  } catch (error) {
    console.error('Delete Campaign Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Campaign record not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during campaign deletion',
      error: error.message,
    });
  }
};

/**
 * @desc    Approve a pending campaign and mark it active
 * @route   PUT /api/campaigns/:id/approve
 * @access  Private (Admin only)
 */
exports.approveCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign record not found',
      });
    }

    // Update status to Active
    campaign.status = 'Active';
    const approvedCampaign = await campaign.save();

    return res.status(200).json({ 
      success: true,
      message: 'Campaign approved successfully and is now Active!', 
      campaign: approvedCampaign 
    });
  } catch (error) {
    console.error('Approve Campaign Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during campaign approval',
      error: error.message,
    });
  }
};
