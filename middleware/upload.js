const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { AppError } = require('./error');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Organize by file type
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'quiz-image') {
      uploadPath += 'quizzes/';
    } else if (file.fieldname === 'document') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'misc/';
    }
    
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(6).toString('hex');
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    cb(null, `${name}-${Date.now()}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'avatar': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'quiz-image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'document': [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  };

  const fieldAllowedTypes = allowedTypes[file.fieldname] || allowedTypes['avatar'];
  
  if (fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type for ${file.fieldname}. Allowed types: ${fieldAllowedTypes.join(', ')}`, 400), false);
  }
};

// Basic upload configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB default
    files: 5, // Maximum 5 files
    fields: 10 // Maximum 10 non-file fields
  }
});

// Specific upload configurations
exports.uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for avatars
    files: 1
  }
}).single('avatar');

exports.uploadQuizImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB for quiz images
    files: 1
  }
}).single('quiz-image');

exports.uploadDocument = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 1
  }
}).single('document');

exports.uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files
  }
}).array('files', 5);

// Memory storage for temporary processing
exports.uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// Upload error handler
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        maxSize: '5MB'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        code: 'TOO_MANY_FILES',
        maxFiles: 5
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field',
        code: 'UNEXPECTED_FILE'
      });
    }
  }
  
  next(err);
};

// File validation middleware
exports.validateFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
      code: 'NO_FILE'
    });
  }
  
  next();
};

// Image processing middleware (optional)
exports.processImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }
  
  try {
    // You can add image processing here using sharp or similar
    // const sharp = require('sharp');
    // const processedImage = await sharp(req.file.buffer)
    //   .resize(300, 300)
    //   .jpeg({ quality: 80 })
    //   .toBuffer();
    
    next();
  } catch (error) {
    next(new AppError('Error processing image', 500));
  }
};

// Clean up old files
exports.cleanupOldFiles = (maxAge = 7 * 24 * 60 * 60 * 1000) => { // 7 days default
  return async (req, res, next) => {
    try {
      const fs = require('fs').promises;
      const uploadsDir = path.join(__dirname, '../uploads');
      
      const cleanupDirectory = async (dir) => {
        try {
          const files = await fs.readdir(dir, { withFileTypes: true });
          
          for (const file of files) {
            const filePath = path.join(dir, file.name);
            
            if (file.isDirectory()) {
              await cleanupDirectory(filePath);
            } else {
              const stats = await fs.stat(filePath);
              const age = Date.now() - stats.mtime.getTime();
              
              if (age > maxAge) {
                await fs.unlink(filePath);
                console.log(`Cleaned up old file: ${filePath}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error cleaning directory ${dir}:`, error);
        }
      };
      
      // Run cleanup asynchronously (don't block request)
      setImmediate(() => cleanupDirectory(uploadsDir));
      
      next();
    } catch (error) {
      // Don't fail the request if cleanup fails
      console.error('Cleanup error:', error);
      next();
    }
  };
};
