const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// User validation rules
exports.validateUserRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters')
    .trim(),
  
  body('fieldOfInterest')
    .isIn([
      'Engineering', 'design', 'marketing', 'science',
      'Information Technology', 'humanities', 'liberal arts', 'Agriculture'
    ])
    .withMessage('Invalid field of interest'),
  
  exports.handleValidationErrors
];

exports.validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  exports.handleValidationErrors
];

// Quiz validation rules
exports.validateQuizGeneration = [
  body('subjectName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject name must be 2-100 characters')
    .trim(),
  
  body('subjectLevel')
    .isIn(['มัธยมศึกษาตอนปลาย', 'ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'])
    .withMessage('Invalid subject level'),
  
  body('topicDetails')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Topic details must be 10-1000 characters')
    .trim(),
  
  body('questionCount')
    .isInt({ min: 1, max: 50 })
    .withMessage('Question count must be between 1 and 50'),
  
  body('difficulty')
    .isIn(['ง่าย', 'ปานกลาง', 'ยาก'])
    .withMessage('Invalid difficulty level'),
  
  exports.handleValidationErrors
];

exports.validateQuizSubmission = [
  body('quizTitle')
    .notEmpty()
    .withMessage('Quiz title is required'),
  
  body('totalQuestions')
    .isInt({ min: 1 })
    .withMessage('Total questions must be a positive integer'),
  
  body('correctCount')
    .isInt({ min: 0 })
    .withMessage('Correct count must be a non-negative integer'),
  
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  
  body('answers')
    .optional()
    .isObject()
    .withMessage('Answers must be an object'),
  
  exports.handleValidationErrors
];

// Assessment validation rules
exports.validateAssessment = [
  body('userName')
    .isLength({ min: 2, max: 100 })
    .withMessage('User name must be 2-100 characters')
    .trim(),
  
  body('fieldOfInterest')
    .notEmpty()
    .withMessage('Field of interest is required'),
  
  body('assessmentTopic')
    .isLength({ min: 2, max: 200 })
    .withMessage('Assessment topic must be 2-200 characters')
    .trim(),
  
  body('currentLevel')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid current level'),
  
  body('work')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Work description cannot exceed 100 characters')
    .trim(),
  
  exports.handleValidationErrors
];

// YouTube search validation
exports.validateYouTubeSearch = [
  body('query')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters')
    .trim(),
  
  body('maxResults')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max results must be between 1 and 50'),
  
  exports.handleValidationErrors
];

// Job market analysis validation
exports.validateJobMarketAnalysis = [
  body('country')
    .notEmpty()
    .withMessage('Country is required')
    .isIn([
      'Thailand', 'Singapore', 'Japan', 'United States', 'Germany',
      'United Kingdom', 'Australia', 'Canada', 'South Korea', 'China'
    ])
    .withMessage('Invalid country'),
  
  body('industry')
    .notEmpty()
    .withMessage('Industry is required')
    .isIn([
      'technology', 'finance', 'healthcare', 'manufacturing',
      'Biochemistry', 'Physics', 'Engineering', 'Computer Science', 'Medical Sciences'
    ])
    .withMessage('Invalid industry'),
  
  exports.handleValidationErrors
];

// Parameter validation
exports.validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  exports.handleValidationErrors
];

// Query validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'score', '-score', 'title', '-title'])
    .withMessage('Invalid sort field'),
  
  exports.handleValidationErrors
];

// File upload validation
exports.validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png'], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }

    next();
  };
};

// Custom validation functions
exports.customValidation = {
  // Check if username is unique
  uniqueUsername: async (value) => {
    const User = require('../models/User');
    const user = await User.findOne({ username: value });
    if (user) {
      throw new Error('Username already exists');
    }
    return true;
  },

  // Check if email is unique
  uniqueEmail: async (value) => {
    const User = require('../models/User');
    const user = await User.findOne({ email: value });
    if (user) {
      throw new Error('Email already exists');
    }
    return true;
  },

  // Check if quiz exists
  quizExists: async (value) => {
    const Quiz = require('../models/Quiz');
    const quiz = await Quiz.findById(value);
    if (!quiz) {
      throw new Error('Quiz not found');
    }
    return true;
  }
};
