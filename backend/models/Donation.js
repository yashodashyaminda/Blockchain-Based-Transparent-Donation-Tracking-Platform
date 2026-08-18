const mongoose = require('mongoose');

/**
 * Donation Schema defining variables representing on-chain/escrow donation transactions.
 */
const DonationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: [true, 'Please specify the destination campaign for this donation'],
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please specify the donor profile logged for this transaction'],
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the donation value in USD'],
      min: [1, 'Donation amount must be greater than 0'],
    },
    transactionHash: {
      type: String,
      required: [true, 'Please provide the Ethereum/decentralized blockchain transaction hash'],
      trim: true,
      unique: true, // Guarantees that the same transaction hash cannot be logged twice
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model('Donation', DonationSchema);
