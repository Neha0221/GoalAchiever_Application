import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api',
  timeout: 30000, // Increased from 10s to 30s
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Request - Token from localStorage:', token ? 'Token exists' : 'No token');
    console.log('API Request - URL:', config.url);
    console.log('API Request - Method:', config.method);
    console.log('API Request - Base URL:', config.baseURL);
    console.log('API Request - Full URL:', `${config.baseURL}${config.url}`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request - Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('API Request - No token found, request will be unauthenticated');
    }
    console.log('API Request - Headers:', config.headers);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response - Success:', {
      status: response.status,
      url: response.config?.url,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.log('API Response - Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      headers: error.response?.headers
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('API Response - 401 Unauthorized, redirecting to login');
      localStorage.removeItem('token');
      // Use React Router navigation instead of window.location
      // The AuthContext will handle the redirect
    }
    
    // Handle timeout errors specifically
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.error('Request timeout:', error.config?.url);
      error.message = 'Request timed out. Please try again.';
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const apiEndpoints = {
  // Health check
  health: () => api.get('/health'),
  
  // Auth endpoints
  auth: {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
  },
  
  // Goals endpoints
  goals: {
    getAll: (url = '/goals') => api.get(url),
    getById: (id) => api.get(`/goals/${id}`),
    create: (goalData) => api.post('/goals', goalData),
    update: (id, goalData) => api.put(`/goals/${id}`, goalData),
    delete: (id) => api.delete(`/goals/${id}`),
    
    // Milestones
    addMilestone: (goalId, milestoneData) => api.post(`/goals/${goalId}/milestones`, milestoneData),
    updateMilestone: (goalId, milestoneId, milestoneData) => api.put(`/goals/${goalId}/milestones/${milestoneId}`, milestoneData),
    deleteMilestone: (goalId, milestoneId) => api.delete(`/goals/${goalId}/milestones/${milestoneId}`),
    
    // Progress
    updateProgress: (goalId, progressData) => api.put(`/goals/${goalId}/progress`, progressData),
    addNote: (goalId, noteData) => api.post(`/goals/${goalId}/notes`, noteData),
    
    // Journeys
    getJourneys: (url = '/goals/journeys') => api.get(url),
    getJourneyById: (journeyId) => api.get(`/goals/journeys/${journeyId}`),
    createJourney: (goalId) => api.post(`/goals/${goalId}/journey`),
    getJourneysByGoal: (goalId) => api.get(`/goals/${goalId}/journeys`),
    
    // Chunks
    addChunk: (journeyId, chunkData) => api.post(`/goals/journeys/${journeyId}/chunks`, chunkData),
    updateChunk: (journeyId, chunkId, chunkData) => api.put(`/goals/journeys/${journeyId}/chunks/${chunkId}`, chunkData),
    deleteChunk: (journeyId, chunkId) => api.delete(`/goals/journeys/${journeyId}/chunks/${chunkId}`),
    updateChunkProgress: (journeyId, chunkId, progressData) => api.put(`/goals/journeys/${journeyId}/chunks/${chunkId}/progress`, progressData),
    addChunkNote: (journeyId, chunkId, noteData) => api.post(`/goals/journeys/${journeyId}/chunks/${chunkId}/notes`, noteData),
    getCurrentChunk: (journeyId) => api.get(`/goals/journeys/${journeyId}/current-chunk`),
    
    // Learning Objectives
    addObjective: (journeyId, chunkId, objectiveData) => api.post(`/goals/journeys/${journeyId}/chunks/${chunkId}/objectives`, objectiveData),
    updateObjective: (journeyId, chunkId, objectiveId, objectiveData) => api.put(`/goals/journeys/${journeyId}/chunks/${chunkId}/objectives/${objectiveId}`, objectiveData),
    
    // Analytics
    getAnalytics: (url = '/goals/analytics') => api.get(url),
    getOverdueGoals: () => api.get('/goals/overdue'),
    getOverdueJourneys: () => api.get('/goals/journeys/overdue'),
    
    // Archive
    archiveGoal: (goalId, data) => api.put(`/goals/${goalId}/archive`, data),
    archiveJourney: (journeyId, data) => api.put(`/goals/journeys/${journeyId}/archive`, data),
  },
  
  // Progress endpoints
  progress: {
    getAll: () => api.get('/progress'),
    getById: (id) => api.get(`/progress/${id}`),
    create: (progressData) => api.post('/progress', progressData),
  },
  
  // Check-in endpoints
  checkin: {
    getAll: (url = '/checkin') => api.get(url),
    getById: (id) => api.get(`/checkin/${id}`),
    create: (checkinData) => api.post('/checkin', checkinData),
    update: (id, checkinData) => api.put(`/checkin/${id}`, checkinData),
    delete: (id) => api.delete(`/checkin/${id}`),
    complete: (id, assessmentData) => api.post(`/checkin/${id}/complete`, assessmentData),
    markMissed: (id) => api.post(`/checkin/${id}/miss`),
    reschedule: (id, data) => api.post(`/checkin/${id}/reschedule`, data),
    getUpcoming: (limit = 10) => api.get(`/checkin/upcoming?limit=${limit}`),
    getOverdue: () => api.get('/checkin/overdue'),
    getByDateRange: (startDate, endDate) => api.get(`/checkin/date-range?startDate=${startDate}&endDate=${endDate}`),
    getStatistics: (timeRange = 'month') => api.get(`/checkin/statistics?timeRange=${timeRange}`),
    getForCalendar: (startDate, endDate) => api.get(`/checkin/calendar?startDate=${startDate}&endDate=${endDate}`),
    createRecurring: (data) => api.post('/checkin/recurring/create', data),
  },
  
  // AI Tutor endpoints
  aiTutor: {
    chat: (message, sessionId) => api.post('/ai-tutor/chat', { message, sessionId }),
    quickResponse: (message) => api.post('/ai-tutor/quick-response', { message }),
    getSessions: (params = {}) => api.get('/ai-tutor/sessions', { params }),
    getSession: (sessionId) => api.get(`/ai-tutor/sessions/${sessionId}`),
    createSession: (sessionData) => api.post('/ai-tutor/sessions', sessionData),
    updateSessionStatus: (sessionId, status) => api.put(`/ai-tutor/sessions/${sessionId}/status`, { status }),
    deleteSession: (sessionId) => api.delete(`/ai-tutor/sessions/${sessionId}`),
    generatePracticeProblems: (moduleId, userProgress) => api.post('/ai-tutor/practice-problems', { moduleId, userProgress }),
    getRecommendations: () => api.get('/ai-tutor/recommendations'),
  },
};

export default api;