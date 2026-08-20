const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema defining columns for Donors, NGOs, and Admin members.
 * Supports Web2 credentials and optional Web3 Wallet binding.
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name or organization name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Prevents returning hashed password by default in queries
    },
    role: {
      type: String,
      enum: ['Donor', 'NGO', 'Admin'],
      default: 'Donor',
      required: true,
    },
    walletAddress: {
      type: String,
      default: '',
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // Specifically useful for manual NGO compliance/admin approval
    },
    registrationNumber: {
      type: String,
      default: '',
      trim: true,
    },
    documentIpfsCID: {
      type: String,
      default: '',
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true, // Auto-adds createdAt and updatedAt fields
  }
);

/**
 * Mongoose Pre-Save middleware to hash user password using bcrypt.
 * Runs automatically prior to saving a User record to database.
 */
UserSchema.pre('save', async function (next) {
  // Only hash password if it has been modified or created new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/**
 * Instance method to compare input password with database hashed password.
 * @param {string} enteredPassword - The plain text password from login input
 * @returns {Promise<boolean>} - True if match, false otherwise
 */
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
