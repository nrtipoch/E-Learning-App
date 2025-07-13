const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
    maxlength: [1000, 'Question cannot exceed 1000 characters']
  },
  options: [{
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Option cannot exceed 500 characters']
  }],
  correct: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: [0, 'Correct answer index must be 0 or greater'],
    max: [3, 'Correct answer index cannot exceed 3']
  },
  explanation: {
    type: String,
    trim: true,
    maxlength: [1500, 'Explanation cannot exceed 1500 characters']
  },
  difficulty: {
    type: String,
    enum: ['ง่าย', 'ปานกลาง', 'ยาก'],
    default: 'ปานกลาง'
  },
  tags: [String],
  points: {
    type: Number,
    default: 1,
    min: [1, 'Points must be at least 1']
  }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  level: {
    type: String,
    required: [true, 'Education level is required'],
    enum: ['มัธยมศึกษาตอนปลาย', 'ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'],
    default: 'ปริญญาตรี'
  },
  difficulty: {
    type: String,
    enum: ['ง่าย', 'ปานกลาง', 'ยาก'],
    default: 'ปานกลาง'
  },
  category: {
    type: String,
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
      'History',
      'Other'
    ],
    default: 'Other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Instructions cannot exceed 500 characters'],
    default: 'เลือกคำตอบที่ถูกต้องที่สุด'
  },
  questions: {
    type: [questionSchema],
    required: [true, 'Quiz must have at least one question'],
    validate: {
      validator: function(questions) {
        return questions.length >= 1 && questions.length <= 100;
      },
      message: 'Quiz must have between 1 and 100 questions'
    }
  },
  timeLimit: {
    type: Number, // in minutes
    min: [1, 'Time limit must be at least 1 minute'],
    max: [300, 'Time limit cannot exceed 300 minutes']
  },
  passingScore: {
    type: Number,
    default: 60,
    min: [0, 'Passing score cannot be negative'],
    max: [100, 'Passing score cannot exceed 100']
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiModel: {
    type: String,
    default: 'gemini-1.5-flash'
  },
  sourceData: {
    subjectName: String,
    subjectLevel: String,
    topicDetails: String,
    questionCount: Number,
    difficulty: String,
    prompt: String
  },
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    totalCompletions: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageTimeSpent: {
      type: Number,
      default: 0
    },
    difficultyRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratings: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  meta: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    featuredAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
quizSchema.index({ subject: 1, level: 1 });
quizSchema.index({ category: 1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ isPublic: 1, isActive: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ 'statistics.averageScore': -1 });
quizSchema.index({ createdAt: -1 });
quizSchema.index({ tags: 1 });

// Virtual for question count
quizSchema.virtual('questionCount').get(function() {
  return this.questions.length;
});

// Virtual for estimated time
quizSchema.virtual('estimatedTime').get(function() {
  // Estimate 1 minute per question if no time limit set
  return this.timeLimit || this.questions.length;
});

// Virtual for completion rate
quizSchema.virtual('completionRate').get(function() {
  if (this.statistics.totalAttempts === 0) return 0;
  return Math.round((this.statistics.totalCompletions / this.statistics.totalAttempts) * 100);
});

// Pre-save middleware to calculate total points
quizSchema.pre('save', function(next) {
  if (this.isModified('questions')) {
    this.totalPoints = this.questions.reduce((sum, question) => sum + (question.points || 1), 0);
  }
  next();
});

// Pre-save middleware to validate questions
quizSchema.pre('save', function(next) {
  if (this.isModified('questions')) {
    for (let question of this.questions) {
      if (question.options.length < 2 || question.options.length > 4) {
        return next(new Error('Each question must have 2-4 options'));
      }
      if (question.correct >= question.options.length) {
        return next(new Error('Correct answer index is out of range'));
      }
    }
  }
  next();
});

// Instance method to add attempt
quizSchema.methods.addAttempt = function(completed = false) {
  this.statistics.totalAttempts += 1;
  if (completed) {
    this.statistics.totalCompletions += 1;
  }
  return this.save();
};

// Instance method to update statistics
quizSchema.methods.updateStatistics = function(score, timeSpent) {
  const stats = this.statistics;
  
  // Update average score
  const totalScore = (stats.averageScore * stats.totalCompletions) + score;
  stats.averageScore = Math.round(totalScore / (stats.totalCompletions + 1));
  
  // Update average time spent
  const totalTime = (stats.averageTimeSpent * stats.totalCompletions) + timeSpent;
  stats.averageTimeSpent = Math.round(totalTime / (stats.totalCompletions + 1));
  
  return this.save();
};

// Instance method to add rating
quizSchema.methods.addRating = function(userId, rating, comment = '') {
  // Remove existing rating from same user
  this.statistics.ratings = this.statistics.ratings.filter(
    r => !r.userId.equals(userId)
  );
  
  // Add new rating
  this.statistics.ratings.push({
    userId,
    rating,
    comment,
    createdAt: new Date()
  });
  
  // Recalculate average difficulty rating
  const totalRating = this.statistics.ratings.reduce((sum, r) => sum + r.rating, 0);
  this.statistics.difficultyRating = totalRating / this.statistics.ratings.length;
  
  return this.save();
};

// Static method to find public quizzes
quizSchema.statics.findPublic = function(filters = {}) {
  return this.find({
    isPublic: true,
    isActive: true,
    ...filters
  }).populate('createdBy', 'username fullName');
};

// Static method to search quizzes
quizSchema.statics.search = function(query, filters = {}) {
  const searchRegex = new RegExp(query, 'i');
  
  return this.find({
    isPublic: true,
    isActive: true,
    $or: [
      { title: searchRegex },
      { subject: searchRegex },
      { description: searchRegex },
      { tags: { $in: [searchRegex] } }
    ],
    ...filters
  }).populate('createdBy', 'username fullName');
};

// Static method to get popular quizzes
quizSchema.statics.getPopular = function(limit = 10) {
  return this.find({
    isPublic: true,
    isActive: true
  })
  .sort({ 
    'statistics.totalAttempts': -1, 
    'statistics.averageScore': -1,
    'meta.likes': -1 
  })
  .limit(limit)
  .populate('createdBy', 'username fullName');
};

// Static method to get featured quizzes
quizSchema.statics.getFeatured = function() {
  return this.find({
    isPublic: true,
    isActive: true,
    'meta.featured': true
  })
  .sort({ 'meta.featuredAt': -1 })
  .populate('createdBy', 'username fullName');
};

module.exports = mongoose.model('Quiz', quizSchema);
