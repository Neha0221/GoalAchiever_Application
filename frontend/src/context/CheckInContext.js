import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { checkinService } from '../services/checkinService';

const CheckInContext = createContext();

// Initial state
const initialState = {
  checkins: [],
  upcomingCheckins: [],
  overdueCheckins: [],
  currentCheckin: null,
  loading: false,
  loadingCheckins: {}, // Track individual check-in loading states
  error: null,
  filters: {
    status: 'all',
    goal: 'all',
    frequency: 'all',
    startDate: null,
    endDate: null
  },
  pagination: {
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  }
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_CHECKIN_LOADING: 'SET_CHECKIN_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_CHECKINS: 'SET_CHECKINS',
  ADD_CHECKIN: 'ADD_CHECKIN',
  UPDATE_CHECKIN: 'UPDATE_CHECKIN',
  DELETE_CHECKIN: 'DELETE_CHECKIN',
  SET_CURRENT_CHECKIN: 'SET_CURRENT_CHECKIN',
  SET_UPCOMING_CHECKINS: 'SET_UPCOMING_CHECKINS',
  SET_OVERDUE_CHECKINS: 'SET_OVERDUE_CHECKINS',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGINATION: 'SET_PAGINATION',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const checkinReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_CHECKIN_LOADING:
      return { 
        ...state, 
        loadingCheckins: { 
          ...state.loadingCheckins, 
          [action.payload.checkinId]: action.payload.loading 
        } 
      };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case actionTypes.SET_CHECKINS:
      console.log('SET_CHECKINS reducer - Setting check-ins:', action.payload);
      const checkinsData = Array.isArray(action.payload.data) ? action.payload.data : [];
      console.log('SET_CHECKINS reducer - Final check-ins array:', checkinsData);
      return { 
        ...state, 
        checkins: checkinsData, 
        pagination: action.payload.pagination || state.pagination,
        loading: false 
      };
    
    case actionTypes.ADD_CHECKIN:
      console.log('ADD_CHECKIN reducer - Current state:', state.checkins);
      console.log('ADD_CHECKIN reducer - Adding check-in:', action.payload);
      const newCheckins = Array.isArray(state.checkins) ? [action.payload, ...state.checkins] : [action.payload];
      console.log('ADD_CHECKIN reducer - New state:', newCheckins);
      return { 
        ...state, 
        checkins: newCheckins
      };
    
    case actionTypes.UPDATE_CHECKIN:
      const updatedCheckins = Array.isArray(state.checkins) 
        ? state.checkins.map(checkin => 
            checkin._id === action.payload._id ? action.payload : checkin
          )
        : [action.payload];
      
      return {
        ...state,
        checkins: updatedCheckins,
        currentCheckin: state.currentCheckin?._id === action.payload._id ? action.payload : state.currentCheckin
      };
    
    case actionTypes.DELETE_CHECKIN:
      return {
        ...state,
        checkins: Array.isArray(state.checkins) 
          ? state.checkins.filter(checkin => checkin._id !== action.payload)
          : [],
        currentCheckin: state.currentCheckin?._id === action.payload ? null : state.currentCheckin
      };
    
    case actionTypes.SET_CURRENT_CHECKIN:
      return { ...state, currentCheckin: action.payload };
    
    case actionTypes.SET_UPCOMING_CHECKINS:
      return { 
        ...state, 
        upcomingCheckins: Array.isArray(action.payload) ? action.payload : [] 
      };
    
    case actionTypes.SET_OVERDUE_CHECKINS:
      return { 
        ...state, 
        overdueCheckins: Array.isArray(action.payload) ? action.payload : [] 
      };
    
    
    
    case actionTypes.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case actionTypes.SET_PAGINATION:
      return { ...state, pagination: { ...state.pagination, ...action.payload } };
    
    case actionTypes.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
};

// Provider component
export const CheckInProvider = ({ children }) => {
  const [state, dispatch] = useReducer(checkinReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Action creators with useCallback to prevent infinite loops
  const setLoading = useCallback((loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }), []);
  const setCheckinLoading = useCallback((checkinId, loading) => dispatch({ type: actionTypes.SET_CHECKIN_LOADING, payload: { checkinId, loading } }), []);
  const setCurrentCheckin = useCallback((checkin) => dispatch({ type: actionTypes.SET_CURRENT_CHECKIN, payload: checkin }), []);
  const setError = useCallback((error) => dispatch({ type: actionTypes.SET_ERROR, payload: error }), []);
  const clearError = useCallback(() => dispatch({ type: actionTypes.CLEAR_ERROR }), []);
  
  const fetchCheckins = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await checkinService.getCheckins(filters);
      console.log('Fetched check-ins response:', response);
      console.log('Fetched check-ins data:', response.data);
      
      // Handle the response structure properly
      // Backend returns: { success: true, data: [array], pagination: {...} }
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('Using response.data.data, length:', response.data.data.length);
        dispatch({ 
          type: actionTypes.SET_CHECKINS, 
          payload: { 
            data: response.data.data, 
            pagination: response.data.pagination 
          } 
        });
      } else if (response.data && Array.isArray(response.data)) {
        console.log('Using response.data directly');
        dispatch({ type: actionTypes.SET_CHECKINS, payload: { data: response.data } });
      } else {
        console.log('No valid data found, setting empty array');
        dispatch({ type: actionTypes.SET_CHECKINS, payload: { data: [] } });
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);
  
  const createCheckin = useCallback(async (checkinData) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      // Create the check-in
      const response = await checkinService.createCheckin(checkinData);
      console.log('Created check-in response:', response);
      
      // Handle the response structure properly
      // Backend returns: { success: true, message: '...', data: checkinObject }
      const checkin = response.data;
      console.log('Created check-in:', checkin);
      
      if (!checkin || !checkin._id) {
        throw new Error('Invalid check-in data received from server');
      }
      
      // Add to state immediately for optimistic update
      dispatch({ type: actionTypes.ADD_CHECKIN, payload: checkin });
      
      // Refresh the check-ins list to ensure consistency
      try {
        await fetchCheckins();
      } catch (refreshError) {
        console.warn('Failed to refresh check-ins after creation:', refreshError);
        // Don't throw here - the check-in was created successfully
      }
      
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return checkin;
    } catch (error) {
      console.error('Error creating check-in:', error);
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, [fetchCheckins]);
  
  const updateCheckin = useCallback(async (checkinId, checkinData) => {
    // Store current check-in for potential rollback
    const currentCheckin = state.checkins.find(checkin => checkin._id === checkinId);
    
    try {
      setCheckinLoading(checkinId, true);
      
      // Optimistic update - immediately update the UI
      if (currentCheckin) {
        const optimisticCheckin = { ...currentCheckin, ...checkinData };
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: optimisticCheckin });
      }
      
      const response = await checkinService.updateCheckin(checkinId, checkinData);
      
      // Update with server response
      const updatedCheckin = response.data?.data || response.data;
      if (updatedCheckin && updatedCheckin._id) {
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: updatedCheckin });
      } else {
        console.error('Invalid check-in data received:', updatedCheckin);
        // Fallback: refresh the check-ins list
        await fetchCheckins();
      }
      
      setCheckinLoading(checkinId, false);
      return updatedCheckin;
    } catch (error) {
      setCheckinLoading(checkinId, false);
      // Revert optimistic update on error
      if (currentCheckin) {
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: currentCheckin });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [fetchCheckins, setCheckinLoading, state.checkins]);
  
  const deleteCheckin = useCallback(async (checkinId) => {
    // Store current check-in for potential rollback
    const currentCheckin = state.checkins.find(checkin => checkin._id === checkinId);
    
    try {
      setCheckinLoading(checkinId, true);
      
      // Optimistic update - immediately remove from UI
      dispatch({ type: actionTypes.DELETE_CHECKIN, payload: checkinId });
      
      await checkinService.deleteCheckin(checkinId);
      setCheckinLoading(checkinId, false);
    } catch (error) {
      setCheckinLoading(checkinId, false);
      // Revert optimistic update on error
      if (currentCheckin) {
        dispatch({ type: actionTypes.ADD_CHECKIN, payload: currentCheckin });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [setCheckinLoading, state.checkins]);
  
  const completeCheckin = useCallback(async (checkinId, assessmentData) => {
    // Store current check-in for potential rollback
    const currentCheckin = state.checkins.find(checkin => checkin._id === checkinId);
    
    try {
      setCheckinLoading(checkinId, true);
      
      // Optimistic update - immediately update the UI
      if (currentCheckin) {
        const optimisticCheckin = {
          ...currentCheckin,
          status: 'completed',
          completedDate: new Date().toISOString(),
          progressAssessment: assessmentData
        };
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: optimisticCheckin });
      }
      
      const response = await checkinService.completeCheckin(checkinId, assessmentData);
      console.log('completeCheckin context - Response:', response);
      
      // Update with server response
      const updatedCheckin = response.data?.data || response.data;
      console.log('completeCheckin context - Updated checkin:', updatedCheckin);
      if (updatedCheckin && updatedCheckin._id) {
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: updatedCheckin });
      } else {
        console.error('completeCheckin context - Invalid response data:', updatedCheckin);
        // Fallback: refresh the check-ins list
        await fetchCheckins();
      }
      
      setCheckinLoading(checkinId, false);
      return updatedCheckin;
    } catch (error) {
      setCheckinLoading(checkinId, false);
      // Revert optimistic update on error
      if (currentCheckin) {
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: currentCheckin });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [setCheckinLoading, state.checkins, fetchCheckins]);
  
  const markAsMissed = useCallback(async (checkinId) => {
    // Store current check-in for potential rollback
    const currentCheckin = state.checkins.find(checkin => checkin._id === checkinId);
    
    try {
      setCheckinLoading(checkinId, true);
      
      // Optimistic update - immediately update the UI
      if (currentCheckin) {
        const optimisticCheckin = {
          ...currentCheckin,
          status: 'missed'
        };
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: optimisticCheckin });
      }
      
      const response = await checkinService.markAsMissed(checkinId);
      
      // Update with server response
      const updatedCheckin = response.data?.data || response.data;
      if (updatedCheckin && updatedCheckin._id) {
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: updatedCheckin });
      }
      
      setCheckinLoading(checkinId, false);
      return updatedCheckin;
    } catch (error) {
      setCheckinLoading(checkinId, false);
      // Revert optimistic update on error
      if (currentCheckin) {
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: currentCheckin });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [setCheckinLoading, state.checkins]);
  
  const rescheduleCheckin = useCallback(async (checkinId, newDate) => {
    // Store current check-in for potential rollback
    const currentCheckin = state.checkins.find(checkin => checkin._id === checkinId);
    
    try {
      setCheckinLoading(checkinId, true);
      
      // Optimistic update - immediately update the UI
      if (currentCheckin) {
        const optimisticCheckin = {
          ...currentCheckin,
          scheduledDate: newDate
        };
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: optimisticCheckin });
      }
      
      const response = await checkinService.rescheduleCheckin(checkinId, newDate);
      console.log('rescheduleCheckin context - Response:', response);
      
      // Update with server response
      const updatedCheckin = response.data?.data || response.data;
      console.log('rescheduleCheckin context - Updated checkin:', updatedCheckin);
      if (updatedCheckin && updatedCheckin._id) {
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: updatedCheckin });
      } else {
        console.error('rescheduleCheckin context - Invalid response data:', updatedCheckin);
        // Fallback: refresh the check-ins list
        await fetchCheckins();
      }
      
      setCheckinLoading(checkinId, false);
      return updatedCheckin;
    } catch (error) {
      setCheckinLoading(checkinId, false);
      // Revert optimistic update on error
      if (currentCheckin) {
        dispatch({ type: actionTypes.UPDATE_CHECKIN, payload: currentCheckin });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [setCheckinLoading, state.checkins, fetchCheckins]);
  
  const getCheckinById = useCallback(async (checkinId) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      // Check if we already have this check-in in context to avoid unnecessary API calls
      const existingCheckin = state.checkins.find(checkin => checkin._id === checkinId);
      if (existingCheckin && !existingCheckin.needsRefresh) {
        dispatch({ type: actionTypes.SET_CURRENT_CHECKIN, payload: existingCheckin });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        return existingCheckin;
      }
      
      const response = await checkinService.getCheckinById(checkinId);
      
      // Handle different response structures
      const checkinData = response.data?.data || response.data;
      
      if (checkinData && checkinData._id) {
        dispatch({ type: actionTypes.SET_CURRENT_CHECKIN, payload: checkinData });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        return checkinData;
      } else {
        console.error('Invalid check-in data received:', checkinData);
        // Fallback: try to get check-in from existing check-ins list
        if (existingCheckin) {
          dispatch({ type: actionTypes.SET_CURRENT_CHECKIN, payload: existingCheckin });
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
          return existingCheckin;
        }
        dispatch({ type: actionTypes.SET_ERROR, payload: 'Invalid check-in data received' });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        throw new Error('Invalid check-in data received');
      }
    } catch (error) {
      console.error('Error fetching check-in:', error);
      
      // Fallback: try to get check-in from existing check-ins list
      const existingCheckin = state.checkins.find(checkin => checkin._id === checkinId);
      if (existingCheckin) {
        dispatch({ type: actionTypes.SET_CURRENT_CHECKIN, payload: existingCheckin });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        return existingCheckin;
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, [state.checkins]);
  
  const fetchUpcomingCheckins = useCallback(async (limit = 10) => {
    try {
      const response = await checkinService.getUpcomingCheckins(limit);
      dispatch({ type: actionTypes.SET_UPCOMING_CHECKINS, payload: response.data });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  }, []);
  
  const fetchOverdueCheckins = useCallback(async () => {
    try {
      const response = await checkinService.getOverdueCheckins();
      dispatch({ type: actionTypes.SET_OVERDUE_CHECKINS, payload: response.data });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  }, []);
  
  
  
  const createRecurringCheckins = useCallback(async (recurringData) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await checkinService.createRecurringCheckins(recurringData);
      // Refresh check-ins list to show new recurring check-ins
      await fetchCheckins();
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [fetchCheckins]);
  
  const setFilters = useCallback((filters) => {
    dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
  }, []);
  
  const setPagination = useCallback((pagination) => {
    dispatch({ type: actionTypes.SET_PAGINATION, payload: pagination });
  }, []);
  
  const resetState = useCallback(() => {
    dispatch({ type: actionTypes.RESET_STATE });
  }, []);

  const actions = useMemo(() => ({
    setLoading,
    setCurrentCheckin,
    setError,
    clearError,
    fetchCheckins,
    createCheckin,
    updateCheckin,
    deleteCheckin,
    completeCheckin,
    markAsMissed,
    rescheduleCheckin,
    getCheckinById,
    fetchUpcomingCheckins,
    fetchOverdueCheckins,
    createRecurringCheckins,
    setFilters,
    setPagination,
    resetState
  }), [
    setLoading,
    setCurrentCheckin,
    setError,
    clearError,
    fetchCheckins,
    createCheckin,
    updateCheckin,
    deleteCheckin,
    completeCheckin,
    markAsMissed,
    rescheduleCheckin,
    getCheckinById,
    fetchUpcomingCheckins,
    fetchOverdueCheckins,
    createRecurringCheckins,
    setFilters,
    setPagination,
    resetState
  ]);

  // Load initial data only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCheckins();
      fetchUpcomingCheckins();
      fetchOverdueCheckins();
    } else {
      // Reset state when not authenticated
      dispatch({ type: actionTypes.RESET_STATE });
    }
  }, [isAuthenticated, fetchCheckins, fetchUpcomingCheckins, fetchOverdueCheckins]);

  const value = {
    ...state,
    ...actions,
    setCheckinLoading
  };

  return (
    <CheckInContext.Provider value={value}>
      {children}
    </CheckInContext.Provider>
  );
};

// Custom hook
export const useCheckIns = () => {
  const context = useContext(CheckInContext);
  if (!context) {
    // Return default values instead of throwing error to prevent crashes
    return {
      checkins: [],
      upcomingCheckins: [],
      overdueCheckins: [],
      currentCheckin: null,
      loading: false,
      error: null,
      filters: { status: 'all', goal: 'all', frequency: 'all', startDate: null, endDate: null },
      pagination: { current: 1, pages: 1, total: 0, limit: 20 },
      fetchCheckins: () => {},
      createCheckin: () => {},
      updateCheckin: () => {},
      deleteCheckin: () => {},
      completeCheckin: () => {},
      markAsMissed: () => {},
      rescheduleCheckin: () => {},
      fetchUpcomingCheckins: () => {},
      fetchOverdueCheckins: () => {},
      createRecurringCheckins: () => {},
      setFilters: () => {},
      setPagination: () => {},
      resetState: () => {}
    };
  }
  return context;
};

export default CheckInContext;
