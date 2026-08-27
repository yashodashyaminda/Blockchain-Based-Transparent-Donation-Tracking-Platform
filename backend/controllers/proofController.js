const Proof = require('../models/Proof');
const Campaign = require('../models/Campaign');
const { uploadFileToIPFS } = require('../services/ipfsService');

/**
 * @desc    Upload an expenditure or milestone completion proof document
 * @route   POST /api/proofs
 * @access  Private (NGO owning the campaign only)
 */
exports.createProof = async (req, res) => {
  const { campaignId, title, milestonePhase, amountRequested, ngoWallet, walletAddress } = req.body;
  const finalNgoWallet = (ngoWallet || walletAddress || req.user.walletAddress || '').toLowerCase().trim();

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

    // 5.5 Dynamic 4-Phase Cap Calculations & NGO Claim Validation Guard
    const reqAmountNum = parseFloat(amountRequested);
    if (isNaN(reqAmountNum) || reqAmountNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a valid positive requested amount',
      });
    }

    const campaignTarget = campaign.targetAmount || 1.0;

    // Fetch existing non-rejected proof claims for this campaign
    const existingProofs = await Proof.find({ campaignId, isRejected: false });

    // Helper to calculate total claimed in a given phase
    const getPhaseClaimedTotal = (phaseName) => {
      return existingProofs
        .filter(p => p.milestonePhase && p.milestonePhase.toLowerCase().trim() === phaseName.toLowerCase().trim())
        .reduce((sum, p) => sum + (p.amountRequested || 0), 0);
    };

    // 5.6 Sequential Milestone Phase Ordering Guard
    const normalizedPhase = milestonePhase.toLowerCase().trim();
    const hasPhase1 = existingProofs.some(p => p.milestonePhase && p.milestonePhase.toLowerCase().includes('phase 1'));
    const hasPhase2 = existingProofs.some(p => p.milestonePhase && p.milestonePhase.toLowerCase().includes('phase 2'));

    if (normalizedPhase.includes('phase 2') && !hasPhase1) {
      return res.status(400).json({
        success: false,
        message: 'Sequential Milestone Violation: You must submit Phase 1: Initial Allocation before claiming Phase 2.',
      });
    }

    if ((normalizedPhase.includes('phase 3') || normalizedPhase.includes('final')) && (!hasPhase1 || !hasPhase2)) {
      return res.status(400).json({
        success: false,
        message: 'Sequential Milestone Violation: You cannot claim Phase 3: Final Completion directly. You must complete Phase 1 and Phase 2 first.',
      });
    }

    let phaseMaxCap = 0;

    if (normalizedPhase.includes('phase 1') || normalizedPhase.includes('initial')) {
      phaseMaxCap = campaignTarget * 0.25;
    } else if (normalizedPhase.includes('phase 2') || normalizedPhase.includes('intermediate')) {
      phaseMaxCap = campaignTarget * 0.25;
    } else if (normalizedPhase.includes('emergency') || normalizedPhase.includes('unplanned') || normalizedPhase.includes('phase 4')) {
      phaseMaxCap = campaignTarget * 0.25;
    } else if (normalizedPhase.includes('phase 3') || normalizedPhase.includes('final')) {
      // Phase 3 Dynamic Cap = Target - (Phase 1 + Phase 2 + Phase 4)
      const claimedP1 = getPhaseClaimedTotal('Phase 1: Initial Allocation');
      const claimedP2 = getPhaseClaimedTotal('Phase 2: Intermediate Progress');
      const claimedP4 = getPhaseClaimedTotal('Emergency / Unplanned Expense');
      phaseMaxCap = Math.max(0, campaignTarget - (claimedP1 + claimedP2 + claimedP4));
    } else {
      phaseMaxCap = campaignTarget * 0.25;
    }

    const currentCumulativeClaimed = getPhaseClaimedTotal(milestonePhase);
    const remainingPhaseCap = Math.max(0, phaseMaxCap - currentCumulativeClaimed);

    if (reqAmountNum > remainingPhaseCap + 0.0001) {
      return res.status(400).json({
        success: false,
        message: `Requested amount (${reqAmountNum}) exceeds the remaining phase cap (${remainingPhaseCap.toFixed(2)}). Maximum claimable balance remaining for this phase is ${remainingPhaseCap.toFixed(2)}.`,
        data: {
          phaseMaxCap,
          currentCumulativeClaimed,
          remainingPhaseCap,
          requestedAmount: reqAmountNum
        }
      });
    }

    // 6. Upload document file to IPFS and retrieve hash CID
    const ipfsCID = await uploadFileToIPFS(req.file);

    // 7. Create proof document record with IPFS CID, ngoWallet, and milestone fields in MongoDB
    const proof = await Proof.create({
      campaignId,
      ngoId: req.user._id,
      ngoWallet: finalNgoWallet,
      title,
      milestonePhase,
      amountRequested,
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
 * @desc    Get all proofs submitted across all campaigns (Admin only)
 * @route   GET /api/proofs
 * @access  Private (Admin only)
 */
exports.getAllProofs = async (req, res) => {
  try {
    const proofs = await Proof.find()
      .populate({
        path: 'ngoId',
        select: 'name email walletAddress',
      })
      .populate({
        path: 'campaignId',
        select: 'title targetAmount raisedAmount status',
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs,
    });
  } catch (error) {
    console.error('Get All Proofs Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching proofs',
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
    if (req.body.payoutTxHash) {
      proof.payoutTxHash = req.body.payoutTxHash;
    } else if (!proof.payoutTxHash) {
      // Default standard on-chain release transaction hash mock fallback if none specified
      proof.payoutTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`;
    }
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

/**
 * @desc    Reject a proof document status (Admin only)
 * @route   PUT /api/proofs/:id/reject
 * @access  Private (Admin only)
 */
exports.rejectProof = async (req, res) => {
  const { reason } = req.body;
  try {
    const proof = await Proof.findById(req.params.id);
    if (!proof) {
      return res.status(404).json({
        success: false,
        message: 'Proof document record not found',
      });
    }

    proof.isRejected = true;
    proof.rejectionReason = reason || 'Compliance document details did not satisfy audit requirements.';
    await proof.save();

    return res.status(200).json({
      success: true,
      message: 'Proof document rejected successfully',
      data: proof,
    });
  } catch (error) {
    console.error('Reject Proof Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during rejection',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all proofs submitted by the logged-in NGO
 * @route   GET /api/proofs/ngo
 * @access  Private (NGO only)
 */
exports.getNgoProofs = async (req, res) => {
  try {
    const proofs = await Proof.find({ ngoId: req.user._id })
      .populate({
        path: 'campaignId',
        select: 'title',
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: proofs.length,
      data: proofs,
    });
  } catch (error) {
    console.error('Get NGO Proofs Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching NGO proofs',
      error: error.message,
    });
  }
};