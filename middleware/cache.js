const NodeCache = require('node-cache');

// Create cache instances with different TTLs
const shortCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes
  checkperiod: 60 // Check for expired keys every minute
});

const mediumCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes
  checkperiod: 300 // Check every 5 minutes
});

const longCache = new NodeCache({ 
  stdTTL: 3600, // 1 hour
  checkperiod: 600 // Check every 10 minutes
});

// Cache middleware factory
exports.cache = (duration = 300, keyGenerator = null) => {
  return (req, res, next) => {
    // Skip caching for authenticated users or POST requests
    if (req.user || req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const key = keyGenerator 
      ? keyGenerator(req) 
      : `${req.method}:${req.originalUrl}`;

    // Try to get from cache
    const cached = getFromCache(key, duration);
    
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original res.json
    const originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200 && data.success !== false) {
        setInCache(key, data, duration);
      }
      
      res.setHeader('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
};

// Short duration cache (5 minutes)
exports.shortCache = exports.cache(300);

// Medium duration cache (30 minutes)
exports.mediumCache = exports.cache(1800);

// Long duration cache (1 hour)
exports.longCache = exports.cache(3600);

// Cache for API responses
exports.apiCache = (req, res, next) => {
  const key = `api:${req.method}:${req.originalUrl}`;
  const cached = shortCache.get(key);
  
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.json(cached);
  }

  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 200) {
      shortCache.set(key, data);
    }
    
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return originalJson.call(this, data);
  };

  next();
};

// Cache for quiz data
exports.quizCache = (req, res, next) => {
  if (req.method !== 'GET' || req.user) {
    return next();
  }

  const key = `quiz:${req.params.id || req.originalUrl}`;
  const cached = mediumCache.get(key);
  
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 200 && data.success !== false) {
      mediumCache.set(key, data);
    }
    
    res.setHeader('X-Cache', 'MISS');
    return originalJson.call(this, data);
  };

  next();
};

// Cache for user statistics
exports.statsCache = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const key = `stats:${req.user._id}`;
  const cached = shortCache.get(key);
  
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 200) {
      shortCache.set(key, data);
    }
    
    res.setHeader('X-Cache', 'MISS');
    return originalJson.call(this, data);
  };

  next();
};

// Helper functions
function getFromCache(key, duration) {
  if (duration <= 300) {
    return shortCache.get(key);
  } else if (duration <= 1800) {
    return mediumCache.get(key);
  } else {
    return longCache.get(key);
  }
}

function setInCache(key, data, duration) {
  if (duration <= 300) {
    shortCache.set(key, data, duration);
  } else if (duration <= 1800) {
    mediumCache.set(key, data, duration);
  } else {
    longCache.set(key, data, duration);
  }
}

// Cache invalidation
exports.invalidateCache = (pattern) => {
  const caches = [shortCache, mediumCache, longCache];
  
  caches.forEach(cache => {
    const keys = cache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.del(key);
      }
    });
  });
};

// Clear all caches
exports.clearCache = () => {
  shortCache.flushAll();
  mediumCache.flushAll();
  longCache.flushAll();
};

// Cache statistics
exports.getCacheStats = () => {
  return {
    short: {
      keys: shortCache.keys().length,
      hits: shortCache.getStats().hits,
      misses: shortCache.getStats().misses
    },
    medium: {
      keys: mediumCache.keys().length,
      hits: mediumCache.getStats().hits,
      misses: mediumCache.getStats().misses
    },
    long: {
      keys: longCache.keys().length,
      hits: longCache.getStats().hits,
      misses: longCache.getStats().misses
    }
  };
};
