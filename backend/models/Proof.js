const mongoose = require('mongoose');

/**
 * Proof Schema defining variables for NGO audit files, bills, or disbursement validation docs.
 */
const ProofSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Please specify the associated campaign for this compliance document'],
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the author NGO uploading this proof file'],
    },
    title: {
      type: String,
      required: [true, 'Please specify a title or descriptive tag for this proof'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    ipfsCID: {
      type: String,
      required: [true, 'Please provide the IPFS content identifier (CID) linked to the document'],
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false, // Must be audited and approved by system Admins to authorize escrow payout releases
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Proof', ProofSchema);
