const { ethers } = require('ethers');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');

const WS_URL = process.env.WS_URL;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const contractABI = [
    "event Donated(address indexed donor, uint256 indexed campaignId, uint256 amount)",
    "event FundsReleased(uint256 indexed campaignId, address indexed ngoAddress, uint256 totalAmount, uint256 feePaid, uint256 netAmount)",
    "event MilestonePayoutReleased(uint256 indexed campaignId, uint256 indexed phaseIndex, address indexed ngoWallet, uint256 amountReleased, uint256 feeDeducted)"
];

const listenToBlockchainEvents = () => {
    if (!CONTRACT_ADDRESS) {
        console.error('⚠️ CONTRACT_ADDRESS is not defined in .env. Web3 listener not started.');
        return;
    }

    try {
        const provider = new ethers.WebSocketProvider(WS_URL);

        // This new piece stops the backend from crashing if the Blockchain is off:
        if (provider.websocket) {
            provider.websocket.on('error', (err) => {
                // Suppress raw unhandled websocket errors to prevent crashing
            });
        }

        // Robustly check if the blockchain is active
        provider.getNetwork().then(() => {
            console.log(`✅ Blockchain is online! Backend successfully switched to Web3 mode.`);
        }).catch(() => {
            console.log(`⚠️ Blockchain is offline. Running Backend in Web2-only mode!`);
        });

        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

        console.log(`🔌 Web3 Listener started via WebSockets. Strictly listening to contract events at: ${CONTRACT_ADDRESS}`);

        contract.on("Donated", async (donorAddress, campaignIdBigInt, amountBigInt, event) => {
            try {
                console.log(`💰 New Donation Event Captured from Smart Contract! Hash: ${event.log.transactionHash}`);

                const amountInWei = amountBigInt.toString();
                const amountInEther = ethers.formatEther(amountInWei);

                let campaignIdStr = campaignIdBigInt.toString(16).padStart(24, '0');

                const campaign = await Campaign.findById(campaignIdStr);
                if (!campaign) {
                    console.error(`❌ Campaign not found for ID: ${campaignIdStr}`);
                    return;
                }

                let donor = await User.findOne({ walletAddress: { $regex: new RegExp(`^${donorAddress}$`, "i") } });
                if (!donor) {
                    donor = await User.create({
                        name: `Donor ${donorAddress.slice(0, 6)}`,
                        email: `${donorAddress.toLowerCase()}@donor.eth`,
                        walletAddress: donorAddress,
                        role: 'Donor',
                        password: 'web3_donor_pass_2026'
                    });
                }
                let donorId = donor._id;

                // Check if donation transaction hash was already logged by REST API or previous listener
                const existingDonation = await Donation.findOne({
                    transactionHash: { $regex: new RegExp(`^${event.log.transactionHash.trim()}$`, "i") }
                });

                if (existingDonation) {
                    existingDonation.donorAddress = donorAddress.toLowerCase();
                    if (donorId) existingDonation.donorId = donorId;
                    await existingDonation.save();
                    console.log(`ℹ️ Transaction ${event.log.transactionHash} already exists in DB. Synchronized donor details.`);
                    return;
                }

                const newDonation = await Donation.create({
                    campaignId: campaign._id,
                    donorId: donorId,
                    donorAddress: donorAddress.toLowerCase(),
                    amount: parseFloat(amountInEther),
                    transactionHash: event.log.transactionHash,
                });

                campaign.raisedAmount += parseFloat(amountInEther);
                // Status remains Active so NGO can continue to claim funds
                await campaign.save();

                console.log(`✅ Donation saved to DB! Campaign ${campaign.title} updated.`);
            } catch (error) {
                if (error.code === 11000) {
                    console.log(`⚠️ Transaction ${event.log.transactionHash} already processed.`);
                } else {
                    console.error('❌ Error processing Donated event:', error);
                }
            }
        });

        contract.on("FundsReleased", async (campaignIdBigInt, ngoAddress, totalAmount, feePaid, netAmount, event) => {
            try {
                console.log(`💸 Funds Released Event Detected! Hash: ${event.log.transactionHash}`);
                let campaignIdStr = campaignIdBigInt.toString(16).padStart(24, '0');
                const campaign = await Campaign.findById(campaignIdStr);
                if (campaign) {
                    campaign.status = 'Completed';
                    await campaign.save();
                    console.log(`✅ Campaign ${campaign.title} marked as Completed in DB!`);
                }
            } catch (error) {
                console.error('❌ Error processing FundsReleased event:', error);
            }
        });

    } catch (error) {
        // Fallback 
        console.log(`⚠️ Could not connect to Blockchain. Running Backend in Web2-only mode!`);
    }
};

module.exports = { listenToBlockchainEvents };