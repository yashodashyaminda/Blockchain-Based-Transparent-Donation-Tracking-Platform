// const Campaign = require('../models/Campaign');
// // --- IPFS INTEGRATION ADDED HERE ---
// const { uploadFileToIPFS } = require('../services/ipfsService');

// /**
//  * @desc    Create a new fundraising campaign with optional IPFS cover image upload
//  * @route   POST /api/campaigns
//  * @access  Private (NGO only)
//  */
// exports.createCampaign = async (req, res) => {
//   try {
//     const { title, description, targetAmount } = req.body;

//     let coverImageIPFSHash = req.body.coverImageIPFSHash || '';

//     // --- IPFS INTEGRATION ADDED HERE ---
//     // If a file (cover image) is uploaded via Multer, upload it to IPFS automatically
//     if (req.file) {
//       coverImageIPFSHash = await uploadFileToIPFS(req.file);
//     }

//     // අලුත් Campaign Object එකක් හදනවා
//     const newCampaign = new Campaign({
//       title: title,
//       description: description,
//       targetAmount: targetAmount,
//       coverImageIPFSHash: coverImageIPFSHash, // Saved IPFS CID
//       ngoId: req.user.id,
//       status: 'Active' // Force Pending default status for admin approval flow
//     });

//     // MongoDB එකට Save කිරීම
//     const savedCampaign = await newCampaign.save();

//     res.status(201).json({
//       success: true,
//       message: "Campaign created successfully and pinned to IPFS",
//       campaign: savedCampaign,
//       ipfsGatewayUrl: coverImageIPFSHash ? `https://gateway.pinata.cloud/ipfs/${coverImageIPFSHash}` : null
//     });

//   } catch (error) {
//     console.error("Save Error:", error);
//     res.status(500).json({ message: "Error saving to database", error: error.message });
//   }
// };

// /**
//  * @desc    Get all campaigns in system
//  * @route   GET /api/campaigns
//  * @access  Public
//  */
// exports.getCampaigns = async (req, res) => {
//   try {
//     const campaigns = await Campaign.find().populate({
//       path: 'ngoId',
//       select: 'name email walletAddress isVerified',
//     });

//     return res.status(200).json({
//       success: true,
//       count: campaigns.length,
//       data: campaigns,
//     });
//   } catch (error) {
//     console.error('Get Campaigns Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error occurred while fetching campaigns',
//       error: error.message,
//     });
//   }
// };

// /**
//  * @desc    Get a single campaign by database ID
//  * @route   GET /api/campaigns/:id
//  * @access  Public
//  */
// exports.getCampaignById = async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id).populate({
//       path: 'ngoId',
//       select: 'name email walletAddress isVerified',
//     });

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign record not found',
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: campaign,
//     });
//   } catch (error) {
//     console.error('Get Campaign By ID Error:', error);
//     if (error.kind === 'ObjectId') {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign record not found (invalid object ID representation)',
//       });
//     }
//     return res.status(500).json({
//       success: false,
//       message: 'Server error occurred while fetching campaign details',
//       error: error.message,
//     });
//   }
// };

// /**
//  * @desc    Update an existing campaign profile
//  * @route   PUT /api/campaigns/:id
//  * @access  Private (NGO creator or Admin only)
//  */
// exports.updateCampaign = async (req, res) => {
//   try {
//     let campaign = await Campaign.findById(req.params.id);

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign record not found',
//       });
//     }

//     const isOwner = campaign.ngoId.toString() === req.user._id.toString();
//     const isAdmin = req.user.role === 'Admin';

//     if (!isOwner && !isAdmin) {
//       return res.status(403).json({
//         success: false,
//         message: 'Forbidden: You are not authorized to update this campaign record',
//       });
//     }

//     // --- IPFS INTEGRATION ADDED HERE ---
//     // If a new cover image file is uploaded during update, push it to IPFS
//     let updateData = req.body;
//     if (req.file) {
//       const newIpfsHash = await uploadFileToIPFS(req.file);
//       updateData.coverImageIPFSHash = newIpfsHash;
//     }

//     campaign = await Campaign.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     return res.status(200).json({
//       success: true,
//       message: 'Campaign profile updated successfully',
//       data: campaign,
//     });
//   } catch (error) {
//     console.error('Update Campaign Error:', error);
//     if (error.kind === 'ObjectId') {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign record not found',
//       });
//     }
//     return res.status(500).json({
//       success: false,
//       message: 'Server error occurred during campaign update',
//       error: error.message,
//     });
//   }
// };

// /**
//  * @desc    Delete a campaign record from registry
//  * @route   DELETE /api/campaigns/:id
//  * @access  Private (NGO creator or Admin only)
//  */
// exports.deleteCampaign = async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign record not found',
//       });
//     }

//     const isOwner = campaign.ngoId.toString() === req.user._id.toString();
//     const isAdmin = req.user.role === 'Admin';

//     if (!isOwner && !isAdmin) {
//       return res.status(403).json({
//         success: false,
//         message: 'Forbidden: You are not authorized to delete this campaign record',
//       });
//     }

//     await Campaign.findByIdAndDelete(req.params.id);

//     return res.status(200).json({
//       success: true,
//       message: 'Campaign deleted successfully',
//     });
//   } catch (error) {
//     console.error('Delete Campaign Error:', error);
//     if (error.kind === 'ObjectId') {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign record not found',
//       });
//     }
//     return res.status(500).json({
//       success: false,
//       message: 'Server error occurred during campaign deletion',
//       error: error.message,
//     });
//   }
// };

// /**
//  * @desc    Approve a pending campaign and mark it active
//  * @route   PUT /api/campaigns/:id/approve
//  * @access  Private (Admin only)
//  */
// exports.approveCampaign = async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);

//     if (!campaign) {
//       return res.status(404).json({
//         success: false,
//         message: 'Campaign record not found',
//       });
//     }

//     campaign.status = 'Active';
//     const approvedCampaign = await campaign.save();

//     return res.status(200).json({
//       success: true,
//       message: 'Campaign approved successfully and is now Active!',
//       campaign: approvedCampaign
//     });
//   } catch (error) {
//     console.error('Approve Campaign Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error occurred during campaign approval',
//       error: error.message,
//     });
//   }
// };

const Campaign = require('../models/Campaign');
const { uploadFileToIPFS } = require('../services/ipfsService');

/**
 * @desc    Create a new fundraising campaign with strict validation BEFORE IPFS upload
 * @route   POST /api/campaigns
 * @access  Private (Verified NGO only)
 */
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, targetAmount } = req.body;

    // 1. Validation check before uploading to IPFS
    if (!title || !description || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and targetAmount',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a cover image file for the campaign',
      });
    }

    // 2. Upload cover image to IPFS via Pinata
    const coverImageIPFSHash = await uploadFileToIPFS(req.file);

    // 3. Create Campaign Object
    const newCampaign = new Campaign({
      title,
      description,
      targetAmount,
      coverImageIPFSHash,
      ngoId: req.user.id,
      status: req.user.isVerified ? 'Active' : 'Pending'
    });

    const savedCampaign = await newCampaign.save();

    // 👉 Response eka lස්සනට IPFS Gateway URL ekath ekka yawanna:
    return res.status(201).json({
      success: true,
      message: "Campaign created successfully and pinned to IPFS",
      campaign: savedCampaign,
      ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${coverImageIPFSHash}`
    });

  } catch (error) {
    console.error("Save Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error saving campaign to database",
      error: error.message
    });
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate({
      path: 'ngoId',
      select: 'name email walletAddress isVerified',
    });
    return res.status(200).json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate({
      path: 'ngoId',
      select: 'name email walletAddress isVerified',
    });
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
    return res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    let campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const isOwner = campaign.ngoId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: Not authorized to update' });
    }

    let updateData = { ...req.body };

    let currentIpfsHash = campaign.coverImageIPFSHash;

    if (req.file) {
      const newIpfsHash = await uploadFileToIPFS(req.file);
      updateData.coverImageIPFSHash = newIpfsHash;
      currentIpfsHash = newIpfsHash;
    }

    campaign = await Campaign.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign,
      ipfsGatewayUrl: `https://gateway.pinata.cloud/ipfs/${currentIpfsHash}`
    });
  } catch (error) {
    console.error('Update Campaign Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during update', error: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const isOwner = campaign.ngoId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    await Campaign.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};