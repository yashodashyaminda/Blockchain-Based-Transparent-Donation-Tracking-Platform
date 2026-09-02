const Campaign = require('../models/Campaign');
const { uploadFileToIPFS } = require('../services/ipfsService');

/**
 * @desc    Create a new fundraising campaign with strict validation BEFORE IPFS upload
 * @route   POST /api/campaigns
 * @access  Private (Verified NGO only)
 */
exports.createCampaign = async (req, res) => {
  try {
    const { title, description, targetAmount, category } = req.body;

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
      status: req.user.isVerified ? 'Active' : 'Pending',
      category: category || 'Education'
    });

    const savedCampaign = await newCampaign.save();

    // 👉 Response send to IPFS Gateway URL
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

    const Donation = require('../models/Donation');
    for (let campaign of campaigns) {
      const donations = await Donation.find({ campaignId: campaign._id });
      const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
      if (Math.abs(campaign.raisedAmount - totalRaised) > 0.0001) {
        campaign.raisedAmount = totalRaised;
        await campaign.save();
      }
    }

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

    const Donation = require('../models/Donation');
    const donations = await Donation.find({ campaignId: campaign._id });
    const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
    if (Math.abs(campaign.raisedAmount - totalRaised) > 0.0001) {
      campaign.raisedAmount = totalRaised;
      await campaign.save();
    }

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