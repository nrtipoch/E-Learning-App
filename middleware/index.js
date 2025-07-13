// Centralized middleware exports
module.exports = {
  // Authentication & Authorization
  ...require('./auth'),
  
  // Validation
  ...require('./validation'),
  
  // Security
  ...require('./security'),
  
  // Error Handling
  ...require('./error'),
  
  // Logging
  ...require('./logger'),
  
  // File Upload
  ...require('./upload'),
  
  // Caching
  ...require('./cache'),
  
  // CORS
  cors: require('./cors'),
  
  // Utility middleware
  requestId: require('./logger').requestId,
  asyncHandler: require('./error').asyncHandler
};
