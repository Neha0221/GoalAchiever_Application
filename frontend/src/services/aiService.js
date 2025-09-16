import { apiEndpoints } from './api';

class AIService {
  // Send chat message
  static async sendMessage(message, sessionId = null) {
    try {
      const response = await apiEndpoints.aiTutor.chat(message, sessionId);
      return response.data;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw this.handleError(error);
    }
  }

  // Quick response for simple questions
  static async quickResponse(message) {
    try {
      const response = await apiEndpoints.aiTutor.quickResponse(message);
      return response.data;
    } catch (error) {
      console.error('Quick Response Error:', error);
      throw this.handleError(error);
    }
  }

  // Get user's chat sessions
  static async getSessions(params = {}) {
    try {
      const response = await apiEndpoints.aiTutor.getSessions(params);
      return response.data;
    } catch (error) {
      console.error('Get Sessions Error:', error);
      throw this.handleError(error);
    }
  }

  // Get specific session
  static async getSession(sessionId) {
    try {
      const response = await apiEndpoints.aiTutor.getSession(sessionId);
      return response.data;
    } catch (error) {
      console.error('Get Session Error:', error);
      
      // Handle 404 errors gracefully
      if (error.response?.status === 404) {
        const notFoundError = new Error('Chat session not found');
        notFoundError.isNotFound = true;
        throw notFoundError;
      }
      
      throw this.handleError(error);
    }
  }

  // Create new session
  static async createSession(sessionData = {}) {
    try {
      const response = await apiEndpoints.aiTutor.createSession(sessionData);
      return response.data;
    } catch (error) {
      console.error('Create Session Error:', error);
      throw this.handleError(error);
    }
  }

  // Update session status
  static async updateSessionStatus(sessionId, status) {
    try {
      const response = await apiEndpoints.aiTutor.updateSessionStatus(sessionId, status);
      return response.data;
    } catch (error) {
      console.error('Update Session Status Error:', error);
      throw this.handleError(error);
    }
  }

  // Delete session
  static async deleteSession(sessionId) {
    try {
      const response = await apiEndpoints.aiTutor.deleteSession(sessionId);
      return response.data;
    } catch (error) {
      console.error('Delete Session Error:', error);
      throw this.handleError(error);
    }
  }

  // Generate practice problems
  static async generatePracticeProblems(moduleId, userProgress = 0) {
    try {
      const response = await apiEndpoints.aiTutor.generatePracticeProblems(moduleId, userProgress);
      return response.data;
    } catch (error) {
      console.error('Generate Practice Problems Error:', error);
      throw this.handleError(error);
    }
  }

  // Get learning recommendations
  static async getRecommendations() {
    try {
      const response = await apiEndpoints.aiTutor.getRecommendations();
      return response.data;
    } catch (error) {
      console.error('Get Recommendations Error:', error);
      throw this.handleError(error);
    }
  }

  // Handle errors and rate limiting
  static handleError(error) {
    console.error('AI Service Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    // Rate limiting (429)
    if (error.response?.status === 429 || error.code === 'AI_RATE_LIMIT') {
      const retryAfter = error.response?.data?.retryAfter || error.retryAfter || 30;
      const minutes = Math.ceil(retryAfter / 60);
      const errorObj = new Error(`AI service is busy. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''} before trying again.`);
      errorObj.isRateLimited = true;
      errorObj.retryAfter = retryAfter;
      errorObj.userMessage = `The AI service is currently busy. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
      return errorObj;
    }

    // Service unavailable (503)
    if (error.response?.status === 503 || error.code === 'AI_SERVICE_DOWN' || error.code === 'AI_SERVICE_UNAVAILABLE') {
      const errorObj = new Error('AI service is temporarily unavailable. Please try again later.');
      errorObj.isServiceUnavailable = true;
      errorObj.userMessage = 'The AI service is temporarily down for maintenance. Please try again in a few minutes.';
      return errorObj;
    }

    // Authentication errors (401)
    if (error.response?.status === 401 || error.code === 'AI_AUTH_ERROR') {
      const errorObj = new Error('Please log in to use the AI Tutor.');
      errorObj.isUnauthorized = true;
      errorObj.userMessage = 'Please log in to continue using the AI Tutor.';
      return errorObj;
    }

    // Server errors (500)
    if (error.response?.status === 500 || error.code === 'AI_GENERATION_FAILED') {
      const errorObj = new Error('AI service is temporarily unavailable. Please try again later.');
      errorObj.isServerError = true;
      errorObj.userMessage = 'The AI service is experiencing issues. Please try again in a moment.';
      return errorObj;
    }

    // Timeout errors (408)
    if (error.response?.status === 408 || error.code === 'AI_TIMEOUT') {
      const errorObj = new Error('Request timeout. Please try again.');
      errorObj.isTimeout = true;
      errorObj.userMessage = 'The request took too long to process. Please try again.';
      return errorObj;
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      const errorObj = new Error('Network connection issue. Please check your internet connection.');
      errorObj.isNetworkError = true;
      errorObj.userMessage = 'Please check your internet connection and try again.';
      return errorObj;
    }

    // Default error handling
    const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    const errorObj = new Error(errorMessage);
    errorObj.originalError = error.message;
    errorObj.userMessage = 'Something went wrong. Please try again.';
    return errorObj;
  }

  // Check if error is rate limited
  static isRateLimited(error) {
    return error.isRateLimited || false;
  }

  // Check if error is unauthorized
  static isUnauthorized(error) {
    return error.isUnauthorized || false;
  }

  // Check if error is server error
  static isServerError(error) {
    return error.isServerError || false;
  }

  // Check if error is service unavailable
  static isServiceUnavailable(error) {
    return error.isServiceUnavailable || false;
  }

  // Check if error is timeout
  static isTimeout(error) {
    return error.isTimeout || false;
  }

  // Check if error is network error
  static isNetworkError(error) {
    return error.isNetworkError || false;
  }

  // Get user-friendly error message
  static getUserMessage(error) {
    return error.userMessage || error.message || 'An unexpected error occurred.';
  }

  // Format message for display
  static formatMessage(message) {
    if (typeof message === 'string') {
      return message;
    }
    
    if (message.content) {
      return message.content;
    }
    
    return 'Unable to display message';
  }

  // Extract practice problems from response
  static extractPracticeProblems(response) {
    try {
      if (response.problems && Array.isArray(response.problems)) {
        return response.problems;
      }
      
      if (typeof response === 'string') {
        const parsed = JSON.parse(response);
        return parsed.problems || parsed;
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting practice problems:', error);
      return [];
    }
  }

  // Format recommendations
  static formatRecommendations(response) {
    if (typeof response === 'string') {
      // Try to split by common list patterns
      const lines = response.split('\n').filter(line => line.trim());
      return lines.map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '').trim());
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    return [response];
  }
}

export default AIService;
