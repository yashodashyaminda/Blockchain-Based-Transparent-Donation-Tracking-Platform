const Proof = require('../models/Proof');
const Campaign = require('../models/Campaign');
const { uploadFileToIPFS } = require('../services/ipfsService');

/**
 * @desc    Upload an expenditure or milestone completion proof document
 * @route   POST /api/proofs
 * @access  Private (NGO owning the campaign only)
 */
exports.createProof = async (req, res) => {
  // අලුත් fields දෙකත් මෙතනින් අල්ලගන්නවා (milestonePhase, amountRequested)
  const { campaignId, title, milestonePhase, amountRequested } = req.body;

  try {
    // 1. Validate required text fields before IPFS upload
    if (!campaignId || !title || !milestonePhase || !amountRequested) {
      return res.status(400).json({
        success: false,
        message: 'Please provide campaignId, proof details, milestone phase, and requested amount',
      });
    }

    // 2. Validate file existence from multer request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a valid proof document (PDF or Image)',
      });
    }

    // 3. Validate that the destination campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // 4. Check if the campaign's status is Active
    if (campaign.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot upload proof for a campaign that is not active.',
      });
    }

    // 5. Authorization Guard: Check if the logged-in NGO is the owner of the campaign
    if (campaign.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot upload expenditure proof for a campaign you do not own',
      });
    }

    // 6. Upload document file to IPFS and retrieve hash CID
    const ipfsCID = await uploadFileToIPFS(req.file);

    // 7. Create proof document record with IPFS CID and new fields in MongoDB
    const proof = await Proof.create({
      campaignId,
      ngoId: req.user._id,
      title,
      milestonePhase,    // අලුතින් ආපු එක
      amountRequested,   // අලුතින් ආපු එක
      ipfsCID,
      isApproved: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Proof document submitted and pinned to IPFS successfully. Awaiting Admin validation.',
      data: proof,
      ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsCID}`
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
 * @desc    Update an existing proof document (Supports optional new document file upload)
 * @route   PUT /api/proofs/:id
 * @access  Private (NGO creator or Admin only)
 */
exports.updateProof = async (req, res) => {
  try {
    let proof = await Proof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof document record not found',
      });
    }

    const isOwner = proof.ngoId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to update this proof record',
      });
    }

    let updateData = { ...req.body };
    let currentIpfsCID = proof.ipfsCID;

    // If a new file is uploaded during update, re-upload to IPFS
    if (req.file) {
      const newIpfsCID = await uploadFileToIPFS(req.file);
      updateData.ipfsCID = newIpfsCID;
      currentIpfsCID = newIpfsCID;
    }

    proof = await Proof.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Proof document updated successfully',
      data: proof,
      ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${currentIpfsCID}`
    });
  } catch (error) {
    console.error('Update Proof Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during proof update',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a proof document record
 * @route   DELETE /api/proofs/:id
 * @access  Private (NGO creator or Admin only)
 */
exports.deleteProof = async (req, res) => {
  try {
    const proof = await Proof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof document record not found',
      });
    }

    const isOwner = proof.ngoId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete this proof record',
      });
    }

    await Proof.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Proof document deleted successfully',
    });
  } catch (error) {
    console.error('Delete Proof Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during proof deletion',
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
    const proof = await Proof.findById(req.params.id);

    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof document record not found',
      });
    }

    proof.isApproved = true;
    await proof.save();

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