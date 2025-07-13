const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  fieldOfInterest: {
    type: String,
    enum: [
      'Engineering',
      'design', 
      'marketing',
      'science',
      'Information Technology',
      'humanities',
      'liberal arts',
      'Agriculture'
    ],
    required: [true, 'Field of interest is required']
  },
  currentLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  skills: {
    type: Map,
    of: Number, // Skill level 0-100
    default: new Map()
  },
  completedQuizzes: [{
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: Number,
    totalQuestions: Number,
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: Number // in seconds
  }],
  assessments: [{
    topic: String,
    score: Number,
    level: String,
    assessedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    language: {
      type: String,
      default: 'th',
      enum: ['th', 'en']
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      quizReminders: {
        type: Boolean,
        default: true
      }
    }
  },
  profile: {
    avatar: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    website: String,
    location: String,
    dateOfBirth: Date
  },
  stats: {
    totalQuizzes: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    totalTimeSpent: {
      type: Number,
      default: 0
    },
    streak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      },
      lastActivity: Date
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'completedQuizzes.completedAt': -1 });

// Virtual for account locked
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update stats
userSchema.pre('save', function(next) {
  if (this.isModified('completedQuizzes')) {
    const quizzes = this.completedQuizzes;
    this.stats.totalQuizzes = quizzes.length;
    
    if (quizzes.length > 0) {
      this.stats.totalScore = quizzes.reduce((sum, quiz) => sum + quiz.score, 0);
      this.stats.averageScore = Math.round(this.stats.totalScore / quizzes.length);
      this.stats.totalTimeSpent = quizzes.reduce((sum, quiz) => sum + (quiz.timeSpent || 0), 0);
    }
  }
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Instance method to add completed quiz
userSchema.methods.addCompletedQuiz = function(quizData) {
  this.completedQuizzes.push(quizData);
  
  // Update streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActivity = this.stats.streak.lastActivity;
  if (lastActivity) {
    const lastActivityDate = new Date(lastActivity);
    lastActivityDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastActivityDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);
    
    if (diffDays === 1) {
      // Consecutive day
      this.stats.streak.current += 1;
      this.stats.streak.longest = Math.max(this.stats.streak.longest, this.stats.streak.current);
    } else if (diffDays > 1) {
      // Broke streak
      this.stats.streak.current = 1;
    }
    // Same day = no change
  } else {
    // First quiz
    this.stats.streak.current = 1;
    this.stats.streak.longest = 1;
  }
  
  this.stats.streak.lastActivity = new Date();
  return this.save();
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password');
};

// Static method to get user stats
userSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(userId) } },
    {
      $project: {
        totalQuizzes: '$stats.totalQuizzes',
        averageScore: '$stats.averageScore',
        totalTimeSpent: '$stats.totalTimeSpent',
        currentStreak: '$stats.streak.current',
        longestStreak: '$stats.streak.longest',
        completedQuizzes: 1,
        assessments: 1,
        skills: 1
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);
