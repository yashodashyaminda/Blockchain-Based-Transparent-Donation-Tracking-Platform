const { ethers } = require('ethers');
const mongoose = require('mongoose');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');

const WS_URL = process.env.WS_URL || 'ws://127.0.0.1:8545/';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const contractABI = [
    "event Donated(address indexed donor, uint256 indexed campaignId, uint256 amount)",
    "event FundsReleased(uint256 indexed campaignId, address indexed ngoAddress, uint256 totalAmount, uint256 feePaid, uint256 netAmount)"
];

const listenToBlockchainEvents = () => {
    if (!CONTRACT_ADDRESS) {
        console.error('⚠️ CONTRACT_ADDRESS is not defined in .env. Web3 listener not started.');
        return;
    }

    try {
        const provider = new ethers.WebSocketProvider(WS_URL);

        // 👉 මෙන්න මේ අලුත් කෑල්ලෙන් තමයි Blockchain එක Off වෙලා තිබ්බොත් Backend එක Crash වෙන එක නවත්තන්නේ:
        if (provider.websocket) {
            provider.websocket.on('error', (err) => {
                console.log(`⚠️ Blockchain is offline. Running Backend in Web2-only mode!`);
            });
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

        console.log(`🔌 Web3 Listener started via WebSockets. Listening to contract: ${CONTRACT_ADDRESS}`);

        // Backend eka blockchain ekka connect welada kiyala check karana test eka
        provider.on("block", (blockNumber) => {
            console.log(`📦 New Block Mined on Blockchain: ${blockNumber}`);
        });

        contract.on("Donated", async (donorAddress, campaignIdBigInt, amountBigInt, event) => {
            try {
                console.log(`💰 New Donation Detected on Blockchain! Hash: ${event.log.transactionHash}`);

                const amountInWei = amountBigInt.toString();
                const amountInEther = ethers.formatEther(amountInWei);

                let campaignIdStr = campaignIdBigInt.toString(16).padStart(24, '0');

                const campaign = await Campaign.findById(campaignIdStr);
                if (!campaign) {
                    console.error(`❌ Campaign not found for ID: ${campaignIdStr}`);
                    return;
                }

                let donor = await User.findOne({ walletAddress: { $regex: new RegExp(`^${donorAddress}$`, "i") } });
                let donorId = donor ? donor._id : null;

                const newDonation = await Donation.create({
                    campaignId: campaign._id,
                    donorId: donorId || new mongoose.Types.ObjectId(), // Create new ObjectId properly
                    amount: parseFloat(amountInEther),
                    transactionHash: event.log.transactionHash,
                });

                campaign.raisedAmount += parseFloat(amountInEther);
                if (campaign.raisedAmount >= campaign.targetAmount) {
                    campaign.status = 'Funded';
                }
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
        // Fallback එකක් විදිහට Provider එක හදාගන්න බැරි වුණොත් මේක අල්ලගන්නවා
        console.log(`⚠️ Could not connect to Blockchain. Running Backend in Web2-only mode!`);
    }
};

module.exports = { listenToBlockchainEvents };