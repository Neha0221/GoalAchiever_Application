const ErrorClassifier = require('../utils/errorClassifier');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Classify the error
  const errorInfo = ErrorClassifier.classify(err, {
    path: req.originalUrl,
    method: req.method,
    user: req.user,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    originalError: {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode
    },
    stack: err.stack
  });

  // Log the error
  ErrorClassifier.logError(err, errorInfo, {
    path: req.originalUrl,
    method: req.method,
    user: req.user,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  });

  // Create standardized response
  const response = ErrorClassifier.createErrorResponse(errorInfo, {
    path: req.originalUrl,
    method: req.method,
    user: req.user,
    originalError: {
      name: err.name,
      message: err.message,
      code: err.code
    },
    stack: err.stack
  });

  res.status(errorInfo.statusCode).json(response);
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};