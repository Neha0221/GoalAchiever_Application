const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Rate limiting for AI tutor endpoints (very conservative for free tier)
const aiTutorRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes per IP (very conservative for free tier)
  message: {
    success: false,
    message: 'Too many AI requests. Please wait 15 minutes before trying again.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for development
  skip: (req) => process.env.NODE_ENV === 'development',
  // Custom key generator to include user ID
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    return req.user ? `${req.user.id}-${ip}` : ip;
  }
});

// Stricter rate limiting for practice problems generation
const practiceProblemsRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 2, // 2 practice problem generations per hour (very conservative for free tier)
  message: {
    success: false,
    message: 'Too many practice problem requests. Please wait 1 hour before trying again.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    return req.user ? `${req.user.id}-practice-${ip}` : `practice-${ip}`;
  }
});

// Rate limiting for quick responses
const quickResponseRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 quick responses per 5 minutes (conservative for free tier)
  message: {
    success: false,
    message: 'Too many quick response requests. Please wait 5 minutes before trying again.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    return req.user ? `${req.user.id}-quick-${ip}` : `quick-${ip}`;
  }
});

module.exports = {
  aiTutorRateLimit,
  practiceProblemsRateLimit,
  quickResponseRateLimit
};
