/**
 * Error Classification Utility
 * Provides comprehensive error classification and handling
 */

class ErrorClassifier {
  /**
   * Classify error type and return appropriate response
   * @param {Error} error - The error object
   * @param {Object} context - Additional context (req, user, etc.)
   * @returns {Object} Classified error response
   */
  static classify(error, context = {}) {
    const errorInfo = {
      type: 'UNKNOWN_ERROR',
      statusCode: 500,
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      retryable: false,
      userMessage: 'Something went wrong. Please try again.',
      details: null
    };

    // Database errors
    if (error.name === 'CastError') {
      errorInfo.type = 'INVALID_INPUT';
      errorInfo.statusCode = 400;
      errorInfo.code = 'INVALID_ID_FORMAT';
      errorInfo.message = 'Invalid ID format provided';
      errorInfo.userMessage = 'The provided ID is not valid. Please check and try again.';
    }

    if (error.name === 'ValidationError') {
      errorInfo.type = 'VALIDATION_ERROR';
      errorInfo.statusCode = 400;
      errorInfo.code = 'VALIDATION_FAILED';
      errorInfo.message = 'Validation failed';
      errorInfo.userMessage = 'Please check your input and try again.';
      errorInfo.details = this.extractValidationErrors(error);
    }

    if (error.code === 11000) {
      errorInfo.type = 'DUPLICATE_ERROR';
      errorInfo.statusCode = 409;
      errorInfo.code = 'DUPLICATE_ENTRY';
      const field = Object.keys(error.keyValue)[0];
      errorInfo.message = `${field} already exists`;
      errorInfo.userMessage = `This ${field} is already in use. Please choose a different one.`;
      errorInfo.details = { field, value: error.keyValue[field] };
    }

    // Authentication errors
    if (error.name === 'JsonWebTokenError') {
      errorInfo.type = 'AUTHENTICATION_ERROR';
      errorInfo.statusCode = 401;
      errorInfo.code = 'INVALID_TOKEN';
      errorInfo.message = 'Invalid authentication token';
      errorInfo.userMessage = 'Your session has expired. Please log in again.';
    }

    if (error.name === 'TokenExpiredError') {
      errorInfo.type = 'AUTHENTICATION_ERROR';
      errorInfo.statusCode = 401;
      errorInfo.code = 'TOKEN_EXPIRED';
      errorInfo.message = 'Authentication token expired';
      errorInfo.userMessage = 'Your session has expired. Please log in again.';
    }

    // Authorization errors
    if (error.name === 'ForbiddenError' || error.statusCode === 403) {
      errorInfo.type = 'AUTHORIZATION_ERROR';
      errorInfo.statusCode = 403;
      errorInfo.code = 'ACCESS_DENIED';
      errorInfo.message = 'Access denied';
      errorInfo.userMessage = 'You do not have permission to perform this action.';
    }

    // Not found errors
    if (error.name === 'NotFoundError' || error.statusCode === 404) {
      errorInfo.type = 'NOT_FOUND';
      errorInfo.statusCode = 404;
      errorInfo.code = 'RESOURCE_NOT_FOUND';
      errorInfo.message = 'Resource not found';
      errorInfo.userMessage = 'The requested resource was not found.';
    }

    // Rate limiting
    if (error.statusCode === 429 || error.message.includes('rate limit')) {
      errorInfo.type = 'RATE_LIMIT';
      errorInfo.statusCode = 429;
      errorInfo.code = 'RATE_LIMIT_EXCEEDED';
      errorInfo.message = 'Rate limit exceeded';
      errorInfo.userMessage = 'Too many requests. Please wait a moment and try again.';
      errorInfo.retryable = true;
      errorInfo.retryAfter = error.retryAfter || 60;
    }

    // Network/Connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorInfo.type = 'SERVICE_UNAVAILABLE';
      errorInfo.statusCode = 503;
      errorInfo.code = 'CONNECTION_ERROR';
      errorInfo.message = 'Service temporarily unavailable';
      errorInfo.userMessage = 'The service is temporarily unavailable. Please try again later.';
      errorInfo.retryable = true;
    }

    // Timeout errors
    if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
      errorInfo.type = 'TIMEOUT_ERROR';
      errorInfo.statusCode = 408;
      errorInfo.code = 'REQUEST_TIMEOUT';
      errorInfo.message = 'Request timeout';
      errorInfo.userMessage = 'The request took too long to complete. Please try again.';
      errorInfo.retryable = true;
    }

    // AI Service specific errors
    if (error.message.includes('Rate limit') || error.message.includes('rate limit')) {
      errorInfo.type = 'AI_RATE_LIMIT';
      errorInfo.statusCode = 429;
      errorInfo.code = 'AI_RATE_LIMIT';
      errorInfo.message = 'AI service rate limit exceeded';
      errorInfo.userMessage = 'AI service is busy. Please wait a moment and try again.';
      errorInfo.retryable = true;
      errorInfo.retryAfter = 30;
    }

    if (error.message.includes('temporarily unavailable') || error.message.includes('service down')) {
      errorInfo.type = 'AI_SERVICE_UNAVAILABLE';
      errorInfo.statusCode = 503;
      errorInfo.code = 'AI_SERVICE_DOWN';
      errorInfo.message = 'AI service temporarily unavailable';
      errorInfo.userMessage = 'AI service is temporarily unavailable. Please try again later.';
      errorInfo.retryable = true;
    }

    // Session errors
    if (error.message.includes('session') || error.message.includes('Session')) {
      errorInfo.type = 'SESSION_ERROR';
      errorInfo.statusCode = 500;
      errorInfo.code = 'SESSION_ERROR';
      errorInfo.message = 'Session processing error';
      errorInfo.userMessage = 'There was an issue with your session. Please try refreshing the page.';
      errorInfo.retryable = true;
    }

    // Context errors
    if (error.message.includes('context') || error.message.includes('Context')) {
      errorInfo.type = 'CONTEXT_ERROR';
      errorInfo.statusCode = 500;
      errorInfo.code = 'CONTEXT_ERROR';
      errorInfo.message = 'Context loading error';
      errorInfo.userMessage = 'Unable to load your context. Please try again.';
      errorInfo.retryable = true;
    }

    return errorInfo;
  }

  /**
   * Extract validation errors from Mongoose validation error
   * @param {Error} error - Mongoose validation error
   * @returns {Array} Array of validation error details
   */
  static extractValidationErrors(error) {
    if (!error.errors) return null;
    
    return Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value,
      kind: err.kind
    }));
  }

  /**
   * Create a standardized error response
   * @param {Object} errorInfo - Classified error information
   * @param {Object} context - Request context
   * @returns {Object} Standardized error response
   */
  static createErrorResponse(errorInfo, context = {}) {
    const response = {
      success: false,
      error: errorInfo.type,
      message: errorInfo.message,
      code: errorInfo.code,
      timestamp: new Date().toISOString(),
      path: context.path || 'unknown',
      method: context.method || 'unknown'
    };

    // Add user-friendly message
    if (errorInfo.userMessage) {
      response.userMessage = errorInfo.userMessage;
    }

    // Add retry information
    if (errorInfo.retryable) {
      response.retryable = true;
      if (errorInfo.retryAfter) {
        response.retryAfter = errorInfo.retryAfter;
      }
    }

    // Add details for validation errors
    if (errorInfo.details) {
      response.details = errorInfo.details;
    }

    // Add development information
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        originalError: context.originalError,
        stack: context.stack,
        user: context.user
      };
    }

    return response;
  }

  /**
   * Log error with appropriate level
   * @param {Error} error - The error object
   * @param {Object} errorInfo - Classified error information
   * @param {Object} context - Request context
   */
  static logError(error, errorInfo, context = {}) {
    const logData = {
      errorType: errorInfo.type,
      errorCode: errorInfo.code,
      statusCode: errorInfo.statusCode,
      message: errorInfo.message,
      timestamp: new Date().toISOString(),
      path: context.path,
      method: context.method,
      userId: context.user?.id,
      userAgent: context.userAgent,
      ip: context.ip
    };

    // Log based on error severity
    if (errorInfo.statusCode >= 500) {
      console.error('=== SERVER ERROR ===', logData);
      console.error('Stack Trace:', error.stack);
    } else if (errorInfo.statusCode >= 400) {
      console.warn('=== CLIENT ERROR ===', logData);
    } else {
      console.info('=== ERROR INFO ===', logData);
    }
  }
}

module.exports = ErrorClassifier;
