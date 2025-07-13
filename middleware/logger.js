const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log files
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 + 
             (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3) + 'ms';
});

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user._id : 'anonymous';
});

// Custom token for request ID
morgan.token('request-id', (req) => {
  return req.id || 'unknown';
});

// Custom token for real IP (behind proxy)
morgan.token('real-ip', (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
});

// Development logger
exports.devLogger = morgan('dev');

// Production logger
exports.prodLogger = morgan(
  ':real-ip - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms',
  { stream: accessLogStream }
);

// Combined logger (for both console and file)
exports.combinedLogger = morgan(
  ':real-ip - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms',
  {
    stream: {
      write: (message) => {
        // Write to file
        accessLogStream.write(message);
        
        // Also log to console in development
        if (process.env.NODE_ENV === 'development') {
          process.stdout.write(message);
        }
      }
    }
  }
);

// Error logger
exports.errorLogger = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user ? req.user._id : 'anonymous',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    requestBody: req.method === 'POST' ? JSON.stringify(req.body) : null,
    requestId: req.id
  };

  // Write to error log file
  errorLogStream.write(JSON.stringify(errorLog) + '\n');

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', errorLog);
  }

  next(err);
};

// API logger with custom format
exports.apiLogger = morgan(
  '[:date[clf]] :method :url :status :response-time-ms - :user-id from :real-ip',
  {
    skip: (req, res) => {
      // Skip logging for health checks and static files
      return req.url.includes('/health') || 
             req.url.includes('/favicon.ico') ||
             req.url.startsWith('/assets/');
    }
  }
);

// Security event logger
exports.securityLogger = (event, req, details = {}) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event: event,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user ? req.user._id : 'anonymous',
    url: req.url,
    method: req.method,
    details: details
  };

  // Write to security log file
  const securityLogStream = fs.createWriteStream(
    path.join(logsDir, 'security.log'),
    { flags: 'a' }
  );
  
  securityLogStream.write(JSON.stringify(securityLog) + '\n');

  // Alert for critical security events
  if (['BRUTE_FORCE', 'SQL_INJECTION', 'XSS_ATTEMPT'].includes(event)) {
    console.warn('🚨 SECURITY ALERT:', securityLog);
  }
};

// Request ID middleware
exports.requestId = (req, res, next) => {
  req.id = generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
};

function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
