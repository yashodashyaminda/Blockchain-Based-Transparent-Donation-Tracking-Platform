const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { listenToBlockchainEvents } = require('./services/web3Service'); // උඩට ගත්තා

// 1. Load environment variables from .env file
dotenv.config();

// 2. Connect to MongoDB database
connectDB();

// 3. Initialize Express Application
const app = express();

// 4. Configure Global Middlewares (මේවා Routes වලට කලින් තියෙන්නම ඕන)
app.use(helmet());
app.use(cors()); // Allow cross-origin requests from front-end applications

// Body parser with size limit (මුලට ගත්තා)
app.use(express.json({ limit: '10kb' })); 
app.use(mongoSanitize());

// Rate Limiter (මුලට ගත්තා)
const limiter = rateLimit({
  max: 100, // එක IP එකකින් පැයකට යවන්න පුළුවන් උපරිම රික්වෙස්ට් ගාණ
  windowMs: 60 * 60 * 1000, // පැය 1යි
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter); // API routes වලට Apply වෙනවා

// 5. Define Core Route Mappings
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/donations', require('./routes/donationRoutes'));
app.use('/api/proofs', require('./routes/proofRoutes'));

// Health check endpoint to verify backend status
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ChainTrust Backend API is fully operational and healthy.',
    timestamp: new Date(),
  });
});

// 6. Global Catch-All Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error Logged:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 7. Web3 & DB Initialization hook
mongoose.connection.once('open', async () => {
  console.log('MongoDB Connected');

  // Auto-backfill missing donorAddress for existing past donations
  try {
    const Donation = require('./models/Donation');
    const unpopulatedDonations = await Donation.find({
      $or: [{ donorAddress: { $exists: false } }, { donorAddress: '' }, { donorAddress: null }]
    }).populate('donorId');

    for (const d of unpopulatedDonations) {
      if (d.donorId && d.donorId.walletAddress) {
        d.donorAddress = d.donorId.walletAddress.toLowerCase();
        await d.save();
      }
    }
    console.log('✅ Donation donorAddress auto-backfill check completed.');
  } catch (err) {
    console.warn('Donation donorAddress backfill notice:', err.message);
  }

  // Start listening to Blockchain Events
  listenToBlockchainEvents();
});

// 8. Start the Listening Express Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});