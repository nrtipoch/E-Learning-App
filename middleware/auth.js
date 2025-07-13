const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+loginAttempts');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: 'The user belonging to this token no longer exists.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 4) Check if user account is locked
    if (currentUser.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts.',
        code: 'ACCOUNT_LOCKED',
        lockUntil: currentUser.lockUntil
      });
    }

    // 5) Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // 6) Check if email is verified (for sensitive operations)
    if (req.route?.path.includes('sensitive') && !currentUser.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required for this action.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // 7) Update last activity
    currentUser.lastLogin = new Date();
    await currentUser.save({ validateBeforeSave: false });

    // 8) Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Authentication failed.',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication - don't require token but set user if provided
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);
        if (currentUser && currentUser.isActive && !currentUser.isLocked) {
          req.user = currentUser;
        }
      } catch (error) {
        // Ignore token errors in optional auth
        console.log('Optional auth token error:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without authentication
  }
};

// Restrict to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action.',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Check if user owns resource or is admin
exports.checkOwnership = (Model, idField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idField];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found.',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Check if user owns the resource or is admin
      if (resource.user?.toString() !== req.user.id && 
          resource.createdBy?.toString() !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your own resources.',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed.',
        code: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

// Rate limiting for authentication attempts
exports.authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
    code: 'TOO_MANY_AUTH_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + (req.body.email || req.body.username || '');
  }
});

// Generate JWT token
exports.signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Send token response
exports.createSendToken = (user, statusCode, res, message = 'Success') => {
  const token = exports.signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove sensitive fields from output
  user.password = undefined;
  user.loginAttempts = undefined;
  user.lockUntil = undefined;
  user.emailVerificationToken = undefined;
  user.passwordResetToken = undefined;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      user
    }
  });
};

// Logout
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Verify email token
exports.verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Email verification token is required.',
        code: 'TOKEN_REQUIRED'
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired email verification token.',
        code: 'INVALID_VERIFICATION_TOKEN'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Email verification failed.',
      code: 'VERIFICATION_ERROR'
    });
  }
};

// Check API key (for external integrations)
exports.checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required.',
      code: 'API_KEY_REQUIRED'
    });
  }

  // Validate API key (implement your logic)
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key.',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};
