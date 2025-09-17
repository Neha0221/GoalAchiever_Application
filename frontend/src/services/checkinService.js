import { apiEndpoints } from './api';

// Retry function for handling network issues
const retryRequest = async (requestFn, retryCount = 0) => {
  const retryConfig = {
    retries: 3,
    retryDelay: (retryCount) => {
      return Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
    },
    retryCondition: (error) => {
      // Retry on network errors or 5xx server errors
      return (
        !error.response || 
        (error.response.status >= 500 && error.response.status < 600) ||
        error.code === 'ECONNABORTED' || // Timeout
        error.code === 'ENOTFOUND' || // DNS error
        error.code === 'ECONNREFUSED' // Connection refused
      );
    }
  };

  try {
    return await requestFn();
  } catch (error) {
    if (retryCount < retryConfig.retries && retryConfig.retryCondition(error)) {
      const delay = retryConfig.retryDelay(retryCount);
      console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${retryConfig.retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retryCount + 1);
    }
    throw error;
  }
};

// Check-in Management Service
export const checkinService = {
  // Basic CRUD operations
  getCheckins: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/checkin?${queryString}` : '/checkin';
      console.log('getCheckins - Calling URL:', url);
      console.log('getCheckins - Base URL:', process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api');
      console.log('getCheckins - Full URL:', `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api'}${url}`);
      
      const response = await apiEndpoints.checkin.getAll(url);
      console.log('getCheckins - Response:', response);
      console.log('getCheckins - Response.data:', response.data);
      console.log('getCheckins - Response.data.data:', response.data?.data);
      console.log('getCheckins - Is response.data an array?', Array.isArray(response.data));
      console.log('getCheckins - Is response.data.data an array?', Array.isArray(response.data?.data));
      
      // Handle the response structure properly
      // GET /checkin returns: { success: true, data: [array], pagination: {...} }
      // We need to return the full response structure for the context to handle
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('getCheckins - Using response.data.data, length:', response.data.data.length);
        return response; // Return the full response structure
      } else if (response.data && Array.isArray(response.data)) {
        console.log('getCheckins - Using response.data directly');
        return response;
      } else {
        console.log('getCheckins - No valid data found, returning empty array');
        return { 
          data: { 
            success: true, 
            data: [], 
            pagination: { current: 1, pages: 1, total: 0, limit: 20 } 
          } 
        };
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method
      });
      return { data: [] };
    }
  },

  getCheckinById: async (checkinId) => {
    return await retryRequest(() => apiEndpoints.checkin.getById(checkinId));
  },

  createCheckin: async (checkinData) => {
    try {
      const response = await apiEndpoints.checkin.create(checkinData);
      console.log('createCheckin - Response:', response);
      console.log('createCheckin - Response.data:', response.data);
      
      // Handle the response structure properly
      // POST /checkin returns: { success: true, message: "...", data: {single object} }
      if (response.data && response.data.success && response.data.data) {
        console.log('createCheckin - Using response.data.data');
        return { data: response.data.data };
      } else {
        console.error('createCheckin - Invalid response structure:', response.data);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('createCheckin - Error:', error);
      throw error;
    }
  },

  updateCheckin: async (checkinId, checkinData) => {
    return await retryRequest(() => apiEndpoints.checkin.update(checkinId, checkinData));
  },

  deleteCheckin: async (checkinId) => {
    return await apiEndpoints.checkin.delete(checkinId);
  },

  // Check-in actions
  completeCheckin: async (checkinId, assessmentData) => {
    const response = await retryRequest(() => apiEndpoints.checkin.complete(checkinId, assessmentData));
    console.log('completeCheckin - Response:', response);
    console.log('completeCheckin - Response.data:', response.data);
    
    // Handle the response structure properly
    // POST /checkin/:id/complete returns: { success: true, message: "...", data: {single object} }
    if (response.data && response.data.success && response.data.data) {
      console.log('completeCheckin - Using response.data.data');
      return { data: response.data.data };
    } else if (response.data && response.data._id) {
      console.log('completeCheckin - Using response.data directly');
      return { data: response.data };
    } else {
      console.log('completeCheckin - No valid data found');
      return { data: null };
    }
  },

  markAsMissed: async (checkinId) => {
    const response = await retryRequest(() => apiEndpoints.checkin.markMissed(checkinId));
    console.log('markAsMissed - Response:', response);
    console.log('markAsMissed - Response.data:', response.data);
    
    // Handle the response structure properly
    if (response.data && response.data.success && response.data.data) {
      console.log('markAsMissed - Using response.data.data');
      return { data: response.data.data };
    } else if (response.data && response.data._id) {
      console.log('markAsMissed - Using response.data directly');
      return { data: response.data };
    } else {
      console.log('markAsMissed - No valid data found');
      return { data: null };
    }
  },

  rescheduleCheckin: async (checkinId, newDate) => {
    const response = await retryRequest(() => apiEndpoints.checkin.reschedule(checkinId, { newDate }));
    console.log('rescheduleCheckin - Response:', response);
    console.log('rescheduleCheckin - Response.data:', response.data);
    
    // Handle the response structure properly
    // POST /checkin/:id/reschedule returns: { success: true, message: "...", data: {single object} }
    if (response.data && response.data.success && response.data.data) {
      console.log('rescheduleCheckin - Using response.data.data');
      return { data: response.data.data };
    } else if (response.data && response.data._id) {
      console.log('rescheduleCheckin - Using response.data directly');
      return { data: response.data };
    } else {
      console.log('rescheduleCheckin - No valid data found');
      return { data: null };
    }
  },

  // Specialized queries
  getUpcomingCheckins: async (limit = 10) => {
    return await retryRequest(() => apiEndpoints.checkin.getUpcoming(limit));
  },

  getOverdueCheckins: async () => {
    return await retryRequest(() => apiEndpoints.checkin.getOverdue());
  },

  getCheckinsByDateRange: async (startDate, endDate) => {
    return await retryRequest(() => apiEndpoints.checkin.getByDateRange(startDate, endDate));
  },



  // Recurring check-ins
  createRecurringCheckins: async (recurringData) => {
    return await retryRequest(() => apiEndpoints.checkin.createRecurring(recurringData));
  },

  // Utility functions
  formatCheckinForDisplay: (checkin) => {
    if (!checkin) return null;
    
    return {
      ...checkin,
      formattedScheduledDate: new Date(checkin.scheduledDate).toLocaleDateString(),
      formattedCompletedDate: checkin.completedDate ? new Date(checkin.completedDate).toLocaleDateString() : null,
      isOverdue: new Date(checkin.scheduledDate) < new Date() && checkin.status === 'scheduled',
      daysUntilNext: checkin.nextScheduledDate ? 
        Math.ceil((new Date(checkin.nextScheduledDate) - new Date()) / (1000 * 60 * 60 * 24)) : null,
      statusColor: getStatusColor(checkin.status),
      frequencyDisplay: getFrequencyDisplay(checkin.frequency)
    };
  },

  // Validation helpers
  validateCheckinData: (data) => {
    const errors = {};
    
    if (!data.goal) {
      errors.goal = 'Goal is required';
    }
    
    if (!data.frequency) {
      errors.frequency = 'Frequency is required';
    }
    
    if (!data.scheduledDate) {
      errors.scheduledDate = 'Scheduled date is required';
    } else if (new Date(data.scheduledDate) < new Date()) {
      errors.scheduledDate = 'Scheduled date cannot be in the past';
    }
    
    if (data.frequency === 'custom') {
      if (!data.customFrequency?.days || data.customFrequency.days < 1) {
        errors.customDays = 'Custom days must be at least 1';
      }
      if (data.customFrequency?.hours && (data.customFrequency.hours < 0 || data.customFrequency.hours > 23)) {
        errors.customHours = 'Custom hours must be between 0 and 23';
      }
    }
    
    if (data.title && data.title.length > 200) {
      errors.title = 'Title must be less than 200 characters';
    }
    
    if (data.description && data.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  validateAssessmentData: (data) => {
    const errors = {};
    
    if (data.overallProgress !== undefined && (data.overallProgress < 0 || data.overallProgress > 100)) {
      errors.overallProgress = 'Overall progress must be between 0 and 100';
    }
    
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 10)) {
      errors.rating = 'Rating must be between 1 and 10';
    }
    
    if (data.mood && !['excellent', 'good', 'neutral', 'poor', 'terrible'].includes(data.mood)) {
      errors.mood = 'Invalid mood value';
    }
    
    if (data.energy && !['high', 'medium', 'low'].includes(data.energy)) {
      errors.energy = 'Invalid energy value';
    }
    
    if (data.motivation && !['very_high', 'high', 'medium', 'low', 'very_low'].includes(data.motivation)) {
      errors.motivation = 'Invalid motivation value';
    }
    
    if (data.challenges && Array.isArray(data.challenges)) {
      data.challenges.forEach((challenge, index) => {
        if (challenge.length > 200) {
          errors[`challenge_${index}`] = 'Challenge must be less than 200 characters';
        }
      });
    }
    
    if (data.achievements && Array.isArray(data.achievements)) {
      data.achievements.forEach((achievement, index) => {
        if (achievement.length > 200) {
          errors[`achievement_${index}`] = 'Achievement must be less than 200 characters';
        }
      });
    }
    
    if (data.notes && data.notes.length > 1000) {
      errors.notes = 'Notes must be less than 1000 characters';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

// Helper functions
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return '#10b981'; // green
    case 'scheduled':
      return '#3b82f6'; // blue
    case 'pending':
      return '#f59e0b'; // yellow
    case 'missed':
      return '#ef4444'; // red
    case 'cancelled':
      return '#6b7280'; // gray
    default:
      return '#6b7280';
  }
};

const getFrequencyDisplay = (frequency) => {
  switch (frequency) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      return 'Weekly';
    case 'bi-weekly':
      return 'Bi-weekly';
    case 'monthly':
      return 'Monthly';
    case 'custom':
      return 'Custom';
    default:
      return frequency;
  }
};

export default checkinService;
