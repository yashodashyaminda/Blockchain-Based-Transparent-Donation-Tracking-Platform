const mongoose = require('mongoose');

/**
 * Campaign Schema defining attributes for NGO crowdfunding campaigns.
 */
const CampaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a campaign title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please add a campaign description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please associate an NGO profile with this campaign'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Please specify target funding amount in USD'],
      min: [1, 'Target amount must be greater than 0'],
    },
    raisedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Raised amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Funded', 'Completed'],
      default: 'Pending',
    },
    coverImageIPFSHash: {
      type: String,
      required: [true, 'Please provide an IPFS CID/hash representing the cover media'],
      trim: true,
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Campaign', CampaignSchema);
