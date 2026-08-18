const Proof = require('../models/Proof');
const Campaign = require('../models/Campaign');

/**
 * @desc    Upload an expenditure or milestone completion proof document
 * @route   POST /api/proofs
 * @access  Private (NGO owning the campaign only)
 */
exports.createProof = async (req, res) => {
  const { campaignId, title, ipfsCID } = req.body;

  try {
    // 1. Validate that the destination campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign associated with this proof does not exist',
      });
    }

    // 2. Authorization Guard: Check if the logged-in NGO is the owner of the campaign
    if (campaign.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot upload expenditure proof for a campaign you do not own',
      });
    }

    // 3. Create proof document
    const proof = await Proof.create({
      campaignId,
      ngoId: req.user._id,
      title,
      ipfsCID,
    });

    return res.status(201).json({
      success: true,
      message: 'Proof document submitted and uploaded successfully. Awaiting Admin validation.',
      data: proof,
    });
  } catch (error) {
    console.error('Create Proof Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while registering proof metadata',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all proofs submitted for a specific campaign
 * @route   GET /api/proofs/campaign/:campaignId
 * @access  Public
 */
exports.getCampaignProofs = async (req, res) => {
  try {
    const proofs = await Proof.find({ campaignId: req.params.campaignId })
      .populate({
        path: 'ngoId',
        select: 'name email walletAddress',
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs,
    });
  } catch (error) {
    console.error('Get Campaign Proofs Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching campaign proofs',
      error: error.message,
    });
  }
};

/**
 * @desc    Approve or reject a proof document status
 * @route   PUT /api/proofs/:id/approve
 * @access  Private (Admin only)
 */
exports.approveProof = async (req, res) => {
  try {
    // 1. URL එකේ තියෙන ID එකෙන් Proof එක හොයාගන්නවා (Body එක බලන්නේ නෑ)
    const proof = await Proof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof document record not found',
      });
    }

    // 2. Body එකෙන් isApproved ගන්න වෙනුවට කෙලින්ම true කරනවා
    proof.isApproved = true;
    await proof.save();

    // 3. Campaign status එක update කරන logic එක (කලින් තිබුණු විදිහටම)
    const campaign = await Campaign.findById(proof.campaignId);
    if (campaign && campaign.status === 'Funded') {
      campaign.status = 'Completed';
      await campaign.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Proof document approved successfully!',
      data: proof,
    });

  } catch (error) {
    console.error('Approve Proof Error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Proof document record not found',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while updating approval validation status',
      error: error.message,
    });
  }
};