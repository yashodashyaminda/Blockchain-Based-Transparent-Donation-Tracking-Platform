const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// 1. Load environment variables from .env file
dotenv.config();

// 2. Connect to MongoDB database
connectDB();

// 3. Initialize Express Application
const app = express();

// 4. Configure Global Middlewares
app.use(cors()); // Allow cross-origin requests from front-end applications
app.use(express.json()); // Body-parser to parse JSON request bodies

// 5. Define Core Route Mappings
app.use('/api/auth', require('./routes/authRoutes'));
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

// 7. Start the Listening Express Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g., failed DB connection during runtime)
process.on('unhandledRejection', (err, promise) => {
  console.log(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// server.js ඇතුළේ:
const { listenToBlockchainEvents } = require('./services/web3Service');

// MongoDB connect වුනාට පස්සේ මේක call කරන්න
mongoose.connection.once('open', () => {
  console.log('MongoDB Connected');

  // Start listening to Blockchain Events
  listenToBlockchainEvents();
});