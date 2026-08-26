const User = require('../models/User');

/**
 * @desc    Bind Web3 wallet address to authenticated user profile
 * @route   PUT /api/users/bind-wallet
 * @access  Private (Authenticated Users)
 */
exports.bindWallet = async (req, res) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid walletAddress to bind to your user profile',
    });
  }

  try {
    // Find authenticated user in database
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Authenticated user profile not found',
      });
    }

    // Update walletAddress field
    user.walletAddress = walletAddress;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Web3 wallet address successfully bound to user profile',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error('Bind Wallet Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred while binding wallet address',
      error: error.message,
    });
  }
};
