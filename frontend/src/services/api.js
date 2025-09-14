import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
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
    getAll: () => api.get('/goals'),
    getById: (id) => api.get(`/goals/${id}`),
    create: (goalData) => api.post('/goals', goalData),
    update: (id, goalData) => api.put(`/goals/${id}`, goalData),
    delete: (id) => api.delete(`/goals/${id}`),
  },
  
  // Progress endpoints
  progress: {
    getAll: () => api.get('/progress'),
    getById: (id) => api.get(`/progress/${id}`),
    create: (progressData) => api.post('/progress', progressData),
  },
  
  // Check-in endpoints
  checkin: {
    getAll: () => api.get('/checkin'),
    getById: (id) => api.get(`/checkin/${id}`),
    create: (checkinData) => api.post('/checkin', checkinData),
  },
  
  // AI Tutor endpoints
  aiTutor: {
    chat: (message) => api.post('/ai-tutor/chat', { message }),
    getSessions: () => api.get('/ai-tutor/sessions'),
    createSession: (sessionData) => api.post('/ai-tutor/sessions', sessionData),
  },
};

export default api;