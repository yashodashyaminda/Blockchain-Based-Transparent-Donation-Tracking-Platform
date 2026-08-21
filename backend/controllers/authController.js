const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { uploadFileToIPFS } = require('../services/ipfsService');


/**
 * Helper function to generate JWT token for a specific user ID
 * @param {string} id - Database user ID
 * @returns {string} - Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'chaintrust_secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d', // Expires in 30 days by default
  });
};

/**
 * @desc    Register a new user (Donor, NGO, or Admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  const { name, email, password, role, walletAddress, registrationNumber, contactInfo } = req.body;

  try {
    // 1. Check if user already exists in the database
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // 2. NGO specific check: NGOs are default not verified until admin reviews documents
    const isVerified = role === 'NGO' ? false : true;

    // 3. Upload verification document to IPFS if NGO and file is present
    let documentIpfsCID = '';
    if (role === 'NGO' && req.file) {
      documentIpfsCID = await uploadFileToIPFS(req.file);
    }

    // 4. Create the user database record (password gets hashed pre-save in model)
    user = await User.create({
      name,
      email,
      password,
      role,
      walletAddress: walletAddress || '',
      isVerified,
      registrationNumber: registrationNumber || '',
      documentIpfsCID,
      contactInfo: contactInfo || '',
    });

    // 5. Generate signed JWT token
    const token = generateToken(user._id);

    // 6. Send response payload containing token and user roles
    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        registrationNumber: user.registrationNumber,
        documentIpfsCID: user.documentIpfsCID,
        contactInfo: user.contactInfo,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during registration. Please try again.',
      error: error.message,
    });
  }
};

/**
 * @desc    Login existing user with credentials
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validate that both email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    // 2. Fetch user profile from database including the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password or email is incorrect.',
      });
    }

    // 3. Compare hashed password with entered password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password or email is incorrect.',
      });
    }

    // 4. Generate signed JWT token
    const token = generateToken(user._id);

    // 5. Send response payload containing token and user roles
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        registrationNumber: user.registrationNumber,
        documentIpfsCID: user.documentIpfsCID,
        contactInfo: user.contactInfo,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during login. Please try again.',
      error: error.message,
    });
  }
};

/**
 * @desc    Stub / Placeholder function for Forgot Password operations
 * @route   POST /api/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate email field exists
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Find the user to ensure it exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user record found matching this email address',
      });
    }

    // --- INTEGRATION PLACEHOLDER ---
    // In production environment:
    // 1. Generate a secure, randomized reset token (e.g. crypto.randomBytes).
    // 2. Hash the token and save it to the database with an expiration timeframe (e.g. 10 minutes).
    // 3. Construct a reset URL pointing to the frontend (e.g., http://localhost:5173/reset-password/<token>).
    // 4. Configure email transporters (e.g., Nodemailer / SMTP / SendGrid).
    // 5. Dispatch HTML/text mail containing reset URL to the target user.

    return res.status(200).json({
      success: true,
      message: 'Reset instructions have been dispatched. (Email placeholder triggered successfully)',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while processing forgot password request.',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin approves / verifies a pending NGO account
 * @route   PUT /api/auth/verify-ngo/:id
 * @access  Private (Admin only)
 */
exports.verifyNGO = async (req, res) => {
  try {
    const ngoUser = await User.findById(req.params.id);

    if (!ngoUser) {
      return res.status(404).json({
        success: false,
        message: 'User record not found',
      });
    }

    if (ngoUser.role !== 'NGO') {
      return res.status(400).json({
        success: false,
        message: 'Specified user is not an NGO account',
      });
    }

    // Set isVerified to true (Approved)
    ngoUser.isVerified = true;
    ngoUser.verificationStatus = 'Approved';
    await ngoUser.save();

    return res.status(200).json({
      success: true,
      message: `NGO account '${ngoUser.name}' has been verified successfully!`,
      data: ngoUser,
    });
  } catch (error) {
    console.error('Verify NGO Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during NGO verification',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all users (Admin only) - Supports query filters (e.g. ?role=NGO&isVerified=false)
 * @route   GET /api/auth/users
 * @access  Private (Admin only)
 */
exports.getUsers = async (req, res) => {
  try {
    // URL එකෙන් එන ෆිල්ටර්ස් අල්ලගන්නවා (උදා: role='NGO', isVerified='false')
    const query = { ...req.query };

    // DB එකෙන් අදාළ යූසර්ස්ලව ගන්නවා (Password එක යවන්නේ නෑ Security නිසා)
    const users = await User.find(query).select('-password');

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message,
    });
  }
};

/**
 * @desc    Admin rejects a pending NGO account
 * @route   PUT /api/auth/reject-ngo/:id
 * @access  Private (Admin only)
 */
exports.rejectNGO = async (req, res) => {
  try {
    const ngoUser = await User.findById(req.params.id);
    if (!ngoUser) {
      return res.status(404).json({ success: false, message: 'NGO not found' });
    }

    ngoUser.isVerified = false;
    ngoUser.verificationStatus = 'Rejected'; // Status tag
    await ngoUser.save();

    return res.status(200).json({
      success: true,
      message: `NGO '${ngoUser.name}' verification was rejected.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    NGO re-submits registration verification document if rejected
 * @route   PUT /api/auth/resubmit-document
 * @access  Private (NGO only)
 */
exports.resubmitDocument = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'NGO') {
      return res.status(400).json({ success: false, message: 'Invalid NGO account' });
    }

    if (req.file) {
      const documentIpfsCID = await uploadFileToIPFS(req.file);
      user.documentIpfsCID = documentIpfsCID;
      user.verificationStatus = 'Pending'; // Reset back to Pending
      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Document re-submitted successfully. Pending Admin review.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};