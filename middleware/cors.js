const cors = require('cors');

// Basic CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',')
      : [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3000',
          'https://your-domain.com',
          'https://www.your-domain.com'
        ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-Cache',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ]
};

// Development CORS (more permissive)
const devCorsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
};

// Production CORS (strict)
const prodCorsOptions = {
  ...corsOptions,
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS.split(',');
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  }
};

// Export appropriate CORS middleware based on environment
module.exports = process.env.NODE_ENV === 'development' 
  ? cors(devCorsOptions)
  : cors(prodCorsOptions);

// Named exports for specific use cases
module.exports.corsOptions = corsOptions;
module.exports.devCors = cors(devCorsOptions);
module.exports.prodCors = cors(prodCorsOptions);

// API-specific CORS
module.exports.apiCors = cors({
  ...corsOptions,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: [...corsOptions.allowedHeaders, 'X-API-Version']
});

// File upload CORS
module.exports.uploadCors = cors({
  ...corsOptions,
  methods: ['POST', 'PUT'],
  allowedHeaders: [...corsOptions.allowedHeaders, 'Content-Length']
});
