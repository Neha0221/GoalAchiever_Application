import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import AIService from '../services/aiService';

const AITutorContext = createContext();

// Initial state
const initialState = {
  // Current session
  currentSession: null,
  sessions: [],
  loading: false,
  error: null,
  
  // Chat state
  messages: [],
  isTyping: false,
  isConnected: false,
  
  // UI state
  isVideoEnabled: false,
  isAudioEnabled: true,
  avatarSettings: {
    type: 'default',
    customization: {}
  },
  
  // Learning state
  activeModule: null,
  practiceProblems: [],
  recommendations: [],
  
  // Statistics
  statistics: {
    totalMessages: 0,
    totalSessions: 0,
    averageResponseTime: 0
  }
};

// Action types
const actionTypes = {
  // Session management
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_SESSIONS: 'SET_SESSIONS',
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  ADD_SESSION: 'ADD_SESSION',
  UPDATE_SESSION: 'UPDATE_SESSION',
  DELETE_SESSION: 'DELETE_SESSION',
  
  // Chat management
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_TYPING: 'SET_TYPING',
  SET_CONNECTED: 'SET_CONNECTED',
  
  // UI state
  TOGGLE_VIDEO: 'TOGGLE_VIDEO',
  TOGGLE_AUDIO: 'TOGGLE_AUDIO',
  UPDATE_AVATAR_SETTINGS: 'UPDATE_AVATAR_SETTINGS',
  
  // Learning state
  SET_ACTIVE_MODULE: 'SET_ACTIVE_MODULE',
  SET_PRACTICE_PROBLEMS: 'SET_PRACTICE_PROBLEMS',
  SET_RECOMMENDATIONS: 'SET_RECOMMENDATIONS',
  
  // Statistics
  UPDATE_STATISTICS: 'UPDATE_STATISTICS'
};

// Reducer
const aiTutorReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case actionTypes.SET_SESSIONS:
      return { ...state, sessions: action.payload };
    
    case actionTypes.SET_CURRENT_SESSION:
      return { 
        ...state, 
        currentSession: action.payload,
        messages: action.payload?.messages || []
      };
    
    case actionTypes.ADD_SESSION:
      return { 
        ...state, 
        sessions: [action.payload, ...state.sessions] 
      };
    
    case actionTypes.UPDATE_SESSION:
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session._id === action.payload._id ? action.payload : session
        ),
        currentSession: state.currentSession?._id === action.payload._id ? action.payload : state.currentSession
      };
    
    case actionTypes.DELETE_SESSION:
      return {
        ...state,
        sessions: state.sessions.filter(session => session._id !== action.payload),
        currentSession: state.currentSession?._id === action.payload ? null : state.currentSession
      };
    
    case actionTypes.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case actionTypes.ADD_MESSAGE:
      return { 
        ...state, 
        messages: [...state.messages, action.payload] 
      };
    
    case actionTypes.SET_TYPING:
      return { ...state, isTyping: action.payload };
    
    case actionTypes.SET_CONNECTED:
      return { ...state, isConnected: action.payload };
    
    case actionTypes.TOGGLE_VIDEO:
      return { ...state, isVideoEnabled: !state.isVideoEnabled };
    
    case actionTypes.TOGGLE_AUDIO:
      return { ...state, isAudioEnabled: !state.isAudioEnabled };
    
    case actionTypes.UPDATE_AVATAR_SETTINGS:
      return { 
        ...state, 
        avatarSettings: { ...state.avatarSettings, ...action.payload } 
      };
    
    case actionTypes.SET_ACTIVE_MODULE:
      return { ...state, activeModule: action.payload };
    
    case actionTypes.SET_PRACTICE_PROBLEMS:
      return { ...state, practiceProblems: action.payload };
    
    case actionTypes.SET_RECOMMENDATIONS:
      return { ...state, recommendations: action.payload };
    
    case actionTypes.UPDATE_STATISTICS:
      return { 
        ...state, 
        statistics: { ...state.statistics, ...action.payload } 
      };
    
    default:
      return state;
  }
};

// Provider component
export const AITutorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(aiTutorReducer, initialState);
  
  // Track ongoing requests to prevent duplicates
  const ongoingRequests = useRef(new Set());
  const lastRequestTime = useRef(0);
  const minRequestInterval = 2000; // 2 seconds between requests

  // Helper function to manage request deduplication and rate limiting
  const makeRequest = async (requestKey, requestFn) => {
    // Check if request is already ongoing
    if (ongoingRequests.current.has(requestKey)) {
      console.log(`Request ${requestKey} already in progress, skipping...`);
      return;
    }

    // Check rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;
    if (timeSinceLastRequest < minRequestInterval) {
      const waitTime = minRequestInterval - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before request ${requestKey}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Add to ongoing requests
    ongoingRequests.current.add(requestKey);
    lastRequestTime.current = Date.now();

    try {
      return await requestFn();
    } finally {
      // Remove from ongoing requests
      ongoingRequests.current.delete(requestKey);
    }
  };

  // Action creators
  const actions = {
    // Session management
    loadSessions: async (params = {}) => {
      return makeRequest('loadSessions', async () => {
        try {
          console.log('Loading sessions...', params);
          dispatch({ type: actionTypes.SET_LOADING, payload: true });
          const response = await AIService.getSessions(params);
          console.log('Sessions loaded:', response);
          dispatch({ type: actionTypes.SET_SESSIONS, payload: response.sessions });
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
          dispatch({ type: actionTypes.CLEAR_ERROR });
          return response;
        } catch (error) {
          console.error('Error loading sessions:', error);
          const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
          dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
          throw error;
        }
      });
    },

    createSession: async (sessionData = {}) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const response = await AIService.createSession(sessionData);
        dispatch({ type: actionTypes.ADD_SESSION, payload: response.session });
        dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: response.session });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        dispatch({ type: actionTypes.CLEAR_ERROR });
        return response.session;
      } catch (error) {
        const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },

    loadSession: async (sessionId) => {
      try {
        if (!sessionId) {
          console.warn('No session ID provided to loadSession');
          return null;
        }
        
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const response = await AIService.getSession(sessionId);
        dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: response.session });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        dispatch({ type: actionTypes.CLEAR_ERROR });
        return response.session;
      } catch (error) {
        console.error('Error loading session:', error);
        const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        
        // Don't set error for 404s, just log them
        if (error.message && error.message.includes('not found')) {
          console.warn('Session not found:', sessionId);
          dispatch({ type: actionTypes.SET_CURRENT_SESSION, payload: null });
        } else {
          dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        }
        
        throw error;
      }
    },

    updateSessionStatus: async (sessionId, status) => {
      try {
        const response = await AIService.updateSessionStatus(sessionId, status);
        dispatch({ type: actionTypes.UPDATE_SESSION, payload: response.session });
        return response.session;
      } catch (error) {
        const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },

    deleteSession: async (sessionId) => {
      try {
        await AIService.deleteSession(sessionId);
        dispatch({ type: actionTypes.DELETE_SESSION, payload: sessionId });
      } catch (error) {
        const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },

    // Chat management
    sendMessage: async (message, sessionId = null) => {
      try {
        dispatch({ type: actionTypes.SET_TYPING, payload: true });
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: { role: 'user', content: message, timestamp: new Date() } });
        
        const response = await AIService.sendMessage(message, sessionId);
        
        dispatch({ type: actionTypes.ADD_MESSAGE, payload: { 
          role: 'assistant', 
          content: response.response, 
          timestamp: new Date(),
          metadata: {
            model: response.model,
            responseTime: response.responseTime
          }
        } });
        
        // Update current session if new one was created
        if (response.sessionId && (!state.currentSession || state.currentSession._id !== response.sessionId)) {
          try {
            await actions.loadSession(response.sessionId);
          } catch (sessionError) {
            console.warn('Failed to load session after message send:', sessionError);
            // Don't throw here, just log the warning
          }
        }
        
        dispatch({ type: actionTypes.SET_TYPING, payload: false });
        return response;
      } catch (error) {
        dispatch({ type: actionTypes.SET_TYPING, payload: false });
        
        // Handle specific error types
        if (error.isNotFound) {
          console.warn('Session not found, creating new session...');
          // Don't show error for session not found, just log it
          return;
        }
        
        const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },

    quickResponse: async (message) => {
      try {
        dispatch({ type: actionTypes.SET_TYPING, payload: true });
        const response = await AIService.quickResponse(message);
        dispatch({ type: actionTypes.SET_TYPING, payload: false });
        return response;
      } catch (error) {
        dispatch({ type: actionTypes.SET_TYPING, payload: false });
        const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },

    // Add quick response to chat messages
    addQuickResponseToChat: async (sessionId, question, response) => {
      try {
        // Add user message
        dispatch({ 
          type: actionTypes.ADD_MESSAGE, 
          payload: { 
            role: 'user', 
            content: question, 
            timestamp: new Date().toISOString() 
          } 
        });
        
        // Add AI response
        dispatch({ 
          type: actionTypes.ADD_MESSAGE, 
          payload: { 
            role: 'assistant', 
            content: response, 
            timestamp: new Date().toISOString(),
            metadata: { model: 'mock-ai-service' }
          } 
        });
        
        // Update current session if it matches
        if (state.currentSession?._id === sessionId) {
          dispatch({ 
            type: actionTypes.UPDATE_SESSION, 
            payload: { 
              ...state.currentSession, 
              lastMessage: response,
              updatedAt: new Date().toISOString()
            } 
          });
        }
      } catch (error) {
        console.error('Error adding quick response to chat:', error);
        throw error;
      }
    },

    // Learning features
    generatePracticeProblems: async (moduleId, userProgress = 0) => {
      try {
        dispatch({ type: actionTypes.SET_LOADING, payload: true });
        const response = await AIService.generatePracticeProblems(moduleId, userProgress);
        const problems = AIService.extractPracticeProblems(response);
        dispatch({ type: actionTypes.SET_PRACTICE_PROBLEMS, payload: problems });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        dispatch({ type: actionTypes.CLEAR_ERROR });
        return problems;
      } catch (error) {
        const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },

    loadRecommendations: async () => {
      return makeRequest('loadRecommendations', async () => {
        try {
          dispatch({ type: actionTypes.SET_LOADING, payload: true });
          const response = await AIService.getRecommendations();
          const recommendations = AIService.formatRecommendations(response.recommendations);
          dispatch({ type: actionTypes.SET_RECOMMENDATIONS, payload: recommendations });
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
          dispatch({ type: actionTypes.CLEAR_ERROR });
          return recommendations;
        } catch (error) {
          const errorMessage = error.message || error.toString() || 'An unexpected error occurred';
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
          dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
          throw error;
        }
      });
    },

    // UI actions
    toggleVideo: () => {
      dispatch({ type: actionTypes.TOGGLE_VIDEO });
    },

    toggleAudio: () => {
      dispatch({ type: actionTypes.TOGGLE_AUDIO });
    },

    updateAvatarSettings: (settings) => {
      dispatch({ type: actionTypes.UPDATE_AVATAR_SETTINGS, payload: settings });
    },

    setActiveModule: (module) => {
      dispatch({ type: actionTypes.SET_ACTIVE_MODULE, payload: module });
    },

    // Utility actions
    clearError: () => {
      dispatch({ type: actionTypes.CLEAR_ERROR });
    },

    clearMessages: () => {
      dispatch({ type: actionTypes.SET_MESSAGES, payload: [] });
    }
  };

  const value = {
    ...state,
    ...actions
  };

  // Load sessions on mount after actions are defined
  useEffect(() => {
    // Only load sessions if we haven't loaded them yet and we're not currently loading
    if (state.sessions.length === 0 && !state.loading && !ongoingRequests.current.has('loadSessions')) {
      const loadSessionsWithTimeout = async () => {
        try {
          await Promise.race([
            actions.loadSessions(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session loading timeout')), 10000)
            )
          ]);
        } catch (error) {
          console.error('Session loading failed or timed out:', error);
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
      };
      
      loadSessionsWithTimeout();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AITutorContext.Provider value={value}>
      {children}
    </AITutorContext.Provider>
  );
};

// Custom hook to use AI Tutor context
export const useAITutor = () => {
  const context = useContext(AITutorContext);
  if (!context) {
    throw new Error('useAITutor must be used within an AITutorProvider');
  }
  return context;
};

export default AITutorContext;
