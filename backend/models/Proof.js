const mongoose = require('mongoose');

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
    milestonePhase: {
      type: String,
      required: [true, 'Please select the target milestone phase'],
      enum: [
        'Phase 1: Initial Allocation',
        'Phase 2: Intermediate Progress',
        'Phase 3: Final Completion',
        'Emergency / Unplanned Expense'
      ],
    },
    amountRequested: {
      type: Number,
      required: [true, 'Please specify the requested amount'],
      min: [0, 'Amount cannot be negative'],
    },
    title: {
      type: String,
      required: [true, 'Please specify the evidence details'],
      trim: true,
      maxlength: [100, 'Details cannot exceed 100 characters'],
    },
    ipfsCID: {
      type: String,
      required: [true, 'Please provide the IPFS content identifier (CID)'],
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Proof', ProofSchema);