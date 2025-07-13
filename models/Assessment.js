const mongoose = require('mongoose');

const assessmentResultSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  userAnswer: String,
  correctAnswer: String,
  isCorrect: {
    type: Boolean,
    required: true
  },
  explanation: String,
  points: {
    type: Number,
    default: 1
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  }
}, { _id: false });

const skillAssessmentSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  confidence: {
    type: Number,
    min: [0, 'Confidence cannot be negative'],
    max: [100, 'Confidence cannot exceed 100'],
    default: 0
  },
  areas: {
    strengths: [String],
    weaknesses: [String],
    improvements: [String]
  }
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['course', 'video', 'book', 'practice', 'project', 'mentor'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  url: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedTime: String, // e.g., "2 hours", "1 week"
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  tags: [String],
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  type: {
    type: String,
    enum: ['knowledge', 'skill', 'aptitude', 'personality', 'career'],
    required: [true, 'Assessment type is required'],
    default: 'knowledge'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Engineering',
      'design', 
      'marketing',
      'science',
      'Information Technology',
      'humanities',
      'liberal arts',
      'Agriculture',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'Business',
      'Language',
      'Other'
    ]
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    trim: true,
    maxlength: [200, 'Topic cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Level is required']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Assessment Data
  totalQuestions: {
    type: Number,
    required: true,
    min: [1, 'Must have at least 1 question']
  },
  answeredQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0,
    min: 0
  },
  maxScore: {
    type: Number,
    required: true,
    min: 1
  },
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Timing
  timeLimit: {
    type: Number, // in minutes
    min: [1, 'Time limit must be at least 1 minute']
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  startedAt: Date,
  completedAt: Date,
  
  // Detailed Results
  results: [assessmentResultSchema],
  skillAssessments: [skillAssessmentSchema],
  
  // AI Analysis
  aiAnalysis: {
    overview: String,
    strengths: [String],
    weaknesses: [String],
    recommendations: [recommendationSchema],
    nextSteps: [String],
    confidenceLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    analysisModel: {
      type: String,
      default: 'gemini-1.5-flash'
    },
    analysisDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Comparison Data
  benchmarks: {
    industryAverage: Number,
    peerAverage: Number,
    topPerformers: Number,
    globalRanking: {
      percentile: Number,
      rank: Number,
      total: Number
    }
  },
  
  // Metadata
  sessionId: String,
  ipAddress: String,
  userAgent: String,
  device: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile'],
    default: 'desktop'
  },
  browser: String,
  
  // Privacy and Settings
  isPublic: {
    type: Boolean,
    default: false
  },
  shareableLink: String,
  tags: [String],
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  
  // Follow-up
  followUpScheduled: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  retakeAllowed: {
    type: Boolean,
    default: true
  },
  retakeCount: {
    type: Number,
    default: 0
  },
  previousAssessments: [{
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    },
    score: Number,
    completedAt: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
assessmentSchema.index({ user: 1, createdAt: -1 });
assessmentSchema.index({ category: 1, topic: 1 });
assessmentSchema.index({ type: 1, status: 1 });
assessmentSchema.index({ percentage: -1 });
assessmentSchema.index({ completedAt: -1 });
assessmentSchema.index({ isPublic: 1 });

// Virtual for completion rate
assessmentSchema.virtual('completionRate').get(function() {
  if (this.totalQuestions === 0) return 0;
  return Math.round((this.answeredQuestions / this.totalQuestions) * 100);
});

// Virtual for accuracy
assessmentSchema.virtual('accuracy').get(function() {
  if (this.answeredQuestions === 0) return 0;
  return Math.round((this.correctAnswers / this.answeredQuestions) * 100);
});

// Virtual for performance level
assessmentSchema.virtual('performanceLevel').get(function() {
  if (this.percentage >= 90) return 'excellent';
  if (this.percentage >= 80) return 'good';
  if (this.percentage >= 60) return 'average';
  if (this.percentage >= 40) return 'below_average';
  return 'poor';
});

// Virtual for time efficiency
assessmentSchema.virtual('timeEfficiency').get(function() {
  if (!this.timeLimit || this.timeSpent === 0) return null;
  const timeUsedPercentage = (this.timeSpent / 60) / this.timeLimit * 100;
  if (timeUsedPercentage <= 50) return 'very_fast';
  if (timeUsedPercentage <= 75) return 'fast';
  if (timeUsedPercentage <= 90) return 'normal';
  if (timeUsedPercentage <= 100) return 'slow';
  return 'overtime';
});

// Pre-save middleware to calculate percentage
assessmentSchema.pre('save', function(next) {
  if (this.isModified('totalScore') || this.isModified('maxScore')) {
    if (this.maxScore > 0) {
      this.percentage = Math.round((this.totalScore / this.maxScore) * 100);
    }
  }
  next();
});

// Pre-save middleware to set completion time
assessmentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
    
    if (this.startedAt) {
      this.timeSpent = Math.round((this.completedAt - this.startedAt) / 1000);
    }
  }
  next();
});

// Instance method to start assessment
assessmentSchema.methods.start = function() {
  this.status = 'in_progress';
  this.startedAt = new Date();
  return this.save();
};

// Instance method to complete assessment
assessmentSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  if (this.startedAt) {
    this.timeSpent = Math.round((this.completedAt - this.startedAt) / 1000);
  }
  return this.save();
};

// Instance method to add result
assessmentSchema.methods.addResult = function(resultData) {
  this.results.push(resultData);
  this.answeredQuestions = this.results.length;
  this.correctAnswers = this.results.filter(r => r.isCorrect).length;
  this.totalScore = this.results.reduce((sum, r) => sum + (r.isCorrect ? r.points : 0), 0);
  return this.save();
};

// Static method to get user statistics
assessmentSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: '$category',
        totalAssessments: { $sum: 1 },
        averageScore: { $avg: '$percentage' },
        bestScore: { $max: '$percentage' },
        recentScore: { $last: '$percentage' },
        totalTimeSpent: { $sum: '$timeSpent' }
      }
    },
    { $sort: { averageScore: -1 } }
  ]);
};

// Static method to get leaderboard
assessmentSchema.statics.getLeaderboard = function(category, limit = 10) {
  return this.aggregate([
    { 
      $match: { 
        category: category,
        status: 'completed',
        isPublic: true
      }
    },
    {
      $group: {
        _id: '$user',
        bestScore: { $max: '$percentage' },
        totalAssessments: { $sum: 1 },
        averageScore: { $avg: '$percentage' },
        recentAssessment: { $last: '$completedAt' }
      }
    },
    { $sort: { bestScore: -1, averageScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        'user.username': 1,
        'user.fullName': 1,
        'user.profile.avatar': 1,
        bestScore: 1,
        totalAssessments: 1,
        averageScore: 1,
        recentAssessment: 1
      }
    }
  ]);
};

module.exports = mongoose.model('Assessment', assessmentSchema);

## 📁 middleware/

### middleware/auth.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
        error: 'Access denied. No token provided.'
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+loginAttempts');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: 'The user belonging to this token no longer exists.'
      });
    }

    // 4) Check if user account is locked
    if (currentUser.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts.'
      });
    }

    // 5) Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      });
    }

    // 6) Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired.'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Authentication failed.'
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
        error: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action.'
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
          error: 'Resource not found.'
        });
      }

      // Check if user owns the resource or is admin
      if (resource.user?.toString() !== req.user.id && 
          resource.createdBy?.toString() !== req.user.id && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only access your own resources.'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed.'
      });
    }
  };
};

// Rate limiting for authentication attempts
exports.authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + (req.body.email || req.body.username || '');
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const attempt = attempts.get(key);
    
    if (now > attempt.resetTime) {
      attempt.count = 1;
      attempt.resetTime = now + windowMs;
      return next();
    }

    if (attempt.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: `Too many authentication attempts. Please try again in ${Math.ceil((attempt.resetTime - now) / 60000)} minutes.`
      });
    }

    attempt.count++;
    next();
  };
};

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

  // Remove password from output
  user.password = undefined;
  user.loginAttempts = undefined;
  user.lockUntil = undefined;

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
        error: 'Email verification token is required.'
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired email verification token.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Email verification failed.'
    });
  }
};

// Check API key (for external integrations)
exports.checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key is required.'
    });
  }

  // Validate API key (implement your logic)
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key.'
    });
  }

  next();
};
