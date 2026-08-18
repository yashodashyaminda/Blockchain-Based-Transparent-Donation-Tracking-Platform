const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Route protector middleware to verify JWT signatures.
 * Restricts access to authenticated users only.
 */
const verifyToken = async (req, res, next) => {
  let token;

  // 1. Check for the token in req.headers.authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract token from Bearer format
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify JWT token using secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chaintrust_secret');

      // 4. Attach the decoded user payload to req.user (e.g., req.user = decoded)
      req.user = decoded;

      // 5. Enrich req.user with Mongoose user profile from DB if possible
      // This ensures attributes like req.user.role and req.user._id are fully populated
      const dbUser = await User.findById(decoded.id);
      if (dbUser) {
        req.user = {
          ...decoded,
          _id: dbUser._id,
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          isVerified: dbUser.isVerified,
          walletAddress: dbUser.walletAddress
        };
      } else {
        // Map decoded.id to req.user._id for fallback compatibility
        req.user._id = decoded.id;
      }

      return next();
    } catch (error) {
      console.error('JWT Token Verification Error:', error);
      // Return 403 Forbidden for invalid or expired tokens
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Access token is invalid or expired',
      });
    }
  }

  // 6. Return 401 Unauthorized if no token is provided
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Access token is missing',
    });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Limits access to specified user roles.
 * @param {string[]} roles - Array of allowed roles (e.g., ['Admin', 'NGO'])
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    // Check if user auth session exists
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Unauthorized user session',
      });
    }

    // Validate that the user's role matches allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    
    return next();
  };
};

module.exports = { verifyToken, checkRole };
