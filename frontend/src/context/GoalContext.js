import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { goalService } from '../services/goalService';

const GoalContext = createContext();

// Initial state
const initialState = {
  goals: [],
  journeys: [],
  currentGoal: null,
  currentJourney: null,
  progress: {
    overall: 0,
    goalsCompleted: 0,
    totalGoals: 0,
    milestonesCompleted: 0,
    totalMilestones: 0
  },
  analytics: {
    totalGoals: 0,
    activeGoals: 0,
    completedGoals: 0,
    overdueGoals: 0,
    averageProgress: 0,
    goalsByCategory: {},
    goalsByComplexity: {},
    goalsByStatus: {}
  },
  loading: false,
  loadingGoals: {}, // Track individual goal loading states
  loadingMilestones: {}, // Track individual milestone loading states
  error: null,
  filters: {
    status: 'all',
    category: 'all',
    complexity: 'all',
    isArchived: false
  }
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_GOAL_LOADING: 'SET_GOAL_LOADING',
  SET_MILESTONE_LOADING: 'SET_MILESTONE_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_GOALS: 'SET_GOALS',
  ADD_GOAL: 'ADD_GOAL',
  UPDATE_GOAL: 'UPDATE_GOAL',
  DELETE_GOAL: 'DELETE_GOAL',
  ARCHIVE_GOAL: 'ARCHIVE_GOAL',
  SET_CURRENT_GOAL: 'SET_CURRENT_GOAL',
  SET_JOURNEYS: 'SET_JOURNEYS',
  ADD_JOURNEY: 'ADD_JOURNEY',
  UPDATE_JOURNEY: 'UPDATE_JOURNEY',
  DELETE_JOURNEY: 'DELETE_JOURNEY',
  SET_CURRENT_JOURNEY: 'SET_CURRENT_JOURNEY',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  SET_ANALYTICS: 'SET_ANALYTICS',
  SET_FILTERS: 'SET_FILTERS',
  RESET_STATE: 'RESET_STATE'
};

// Reducer
const goalReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_GOAL_LOADING:
      return { 
        ...state, 
        loadingGoals: { 
          ...state.loadingGoals, 
          [action.payload.goalId]: action.payload.loading 
        } 
      };
    
    case actionTypes.SET_MILESTONE_LOADING:
      return { 
        ...state, 
        loadingMilestones: { 
          ...state.loadingMilestones, 
          [action.payload.milestoneId]: action.payload.loading 
        } 
      };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case actionTypes.SET_GOALS:
      return { 
        ...state, 
        goals: Array.isArray(action.payload) ? action.payload : [], 
        loading: false 
      };
    
    case actionTypes.ADD_GOAL:
      return { 
        ...state, 
        goals: Array.isArray(state.goals) ? [action.payload, ...state.goals] : [action.payload] 
      };
    
    case actionTypes.UPDATE_GOAL:
      console.log('UPDATE_GOAL Reducer - Payload:', action.payload);
      console.log('UPDATE_GOAL Reducer - Current Goals:', state.goals);
      
      const updatedGoals = Array.isArray(state.goals) 
        ? state.goals.map(goal => {
            // Use string comparison to handle potential type differences
            const goalId = String(goal._id);
            const payloadId = String(action.payload._id);
            console.log('Comparing goal._id:', goalId, 'with payload._id:', payloadId);
            return goalId === payloadId ? action.payload : goal;
          })
        : [action.payload];
      
      console.log('UPDATE_GOAL Reducer - Updated Goals:', updatedGoals);
      
      // Also check if any goal was actually updated
      const wasUpdated = updatedGoals.some(goal => 
        String(goal._id) === String(action.payload._id) && 
        goal === action.payload
      );
      
      if (!wasUpdated) {
        console.warn('No goal was updated in the array. Adding the goal to the list.');
        updatedGoals.unshift(action.payload);
      }
      
      return {
        ...state,
        goals: updatedGoals,
        currentGoal: String(state.currentGoal?._id) === String(action.payload._id) ? action.payload : state.currentGoal
      };
    
    case actionTypes.DELETE_GOAL:
      return {
        ...state,
        goals: Array.isArray(state.goals) 
          ? state.goals.filter(goal => goal._id !== action.payload)
          : [],
        currentGoal: state.currentGoal?._id === action.payload ? null : state.currentGoal
      };
    
    case actionTypes.ARCHIVE_GOAL:
      return {
        ...state,
        goals: Array.isArray(state.goals) 
          ? state.goals.map(goal => 
              goal._id === action.payload.goalId 
                ? { ...goal, isArchived: action.payload.isArchived, archivedAt: action.payload.archivedAt }
                : goal
            )
          : []
      };
    
    case actionTypes.SET_CURRENT_GOAL:
      return { ...state, currentGoal: action.payload };
    
    case actionTypes.SET_JOURNEYS:
      return { 
        ...state, 
        journeys: Array.isArray(action.payload) ? action.payload : [] 
      };
    
    case actionTypes.ADD_JOURNEY:
      return { 
        ...state, 
        journeys: Array.isArray(state.journeys) ? [action.payload, ...state.journeys] : [action.payload] 
      };
    
    case actionTypes.UPDATE_JOURNEY:
      return {
        ...state,
        journeys: Array.isArray(state.journeys) 
          ? state.journeys.map(journey =>
              journey._id === action.payload._id ? action.payload : journey
            )
          : [action.payload],
        currentJourney: state.currentJourney?._id === action.payload._id ? action.payload : state.currentJourney
      };
    
    case actionTypes.DELETE_JOURNEY:
      return {
        ...state,
        journeys: Array.isArray(state.journeys) 
          ? state.journeys.filter(journey => journey._id !== action.payload)
          : [],
        currentJourney: state.currentJourney?._id === action.payload ? null : state.currentJourney
      };
    
    case actionTypes.SET_CURRENT_JOURNEY:
      return { ...state, currentJourney: action.payload };
    
    case actionTypes.UPDATE_PROGRESS:
      return { ...state, progress: { ...state.progress, ...action.payload } };
    
    case actionTypes.SET_ANALYTICS:
      return { ...state, analytics: action.payload };
    
    case actionTypes.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    
    case actionTypes.RESET_STATE:
      return initialState;
    
    default:
      return state;
  }
};

// Provider component
export const GoalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(goalReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Action creators with useCallback to prevent infinite loops
  const setLoading = useCallback((loading) => dispatch({ type: actionTypes.SET_LOADING, payload: loading }), []);
  const setGoalLoading = useCallback((goalId, loading) => dispatch({ type: actionTypes.SET_GOAL_LOADING, payload: { goalId, loading } }), []);
  const setMilestoneLoading = useCallback((milestoneId, loading) => dispatch({ type: actionTypes.SET_MILESTONE_LOADING, payload: { milestoneId, loading } }), []);
  const setCurrentGoal = useCallback((goal) => dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: goal }), []);
  const setError = useCallback((error) => dispatch({ type: actionTypes.SET_ERROR, payload: error }), []);
  const clearError = useCallback(() => dispatch({ type: actionTypes.CLEAR_ERROR }), []);
  
  const fetchGoals = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await goalService.getGoals(filters);
      dispatch({ type: actionTypes.SET_GOALS, payload: response.data });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  }, []);
  
  const createGoal = useCallback(async (goalData) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await goalService.createGoal(goalData);
      dispatch({ type: actionTypes.ADD_GOAL, payload: response.data });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);
  
  const updateGoal = useCallback(async (goalId, goalData) => {
    // Store current goal for potential rollback
    const currentGoal = state.goals.find(goal => goal._id === goalId);
    
    try {
      setGoalLoading(goalId, true);
      
      // Optimistic update - immediately update the UI
      if (currentGoal) {
        const optimisticGoal = { ...currentGoal, ...goalData };
        dispatch({ type: actionTypes.UPDATE_GOAL, payload: optimisticGoal });
      }
      
      const response = await goalService.updateGoal(goalId, goalData);
      
      // Debug logging
      console.log('Update Goal Response:', response);
      console.log('Goal ID:', goalId);
      console.log('Response Data:', response.data);
      
      // Ensure we have the correct data structure
      const updatedGoal = response.data?.data || response.data;
      if (updatedGoal && updatedGoal._id) {
        dispatch({ type: actionTypes.UPDATE_GOAL, payload: updatedGoal });
      } else {
        console.error('Invalid goal data received:', updatedGoal);
        // Fallback: refresh the goals list
        console.log('Falling back to refreshing goals list...');
        await fetchGoals();
      }
      
      setGoalLoading(goalId, false);
      return updatedGoal;
    } catch (error) {
      setGoalLoading(goalId, false);
      // Revert optimistic update on error
      if (currentGoal) {
        dispatch({ type: actionTypes.UPDATE_GOAL, payload: currentGoal });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [fetchGoals, setGoalLoading, state.goals]);
  
  const deleteGoal = useCallback(async (goalId) => {
    // Store current goal for potential rollback
    const currentGoal = state.goals.find(goal => goal._id === goalId);
    
    try {
      setGoalLoading(goalId, true);
      
      // Optimistic update - immediately remove from UI
      dispatch({ type: actionTypes.DELETE_GOAL, payload: goalId });
      
      await goalService.deleteGoal(goalId);
      setGoalLoading(goalId, false);
    } catch (error) {
      setGoalLoading(goalId, false);
      // Revert optimistic update on error
      if (currentGoal) {
        dispatch({ type: actionTypes.ADD_GOAL, payload: currentGoal });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [setGoalLoading, state.goals]);
  
  const archiveGoal = useCallback(async (goalId, isArchived) => {
    // Store current goal for potential rollback
    const currentGoal = state.goals.find(goal => goal._id === goalId);
    
    try {
      setGoalLoading(goalId, true);
      
      // Optimistic update - immediately update the UI
      const archivedAt = isArchived ? new Date() : undefined;
      dispatch({ 
        type: actionTypes.ARCHIVE_GOAL, 
        payload: { goalId, isArchived, archivedAt } 
      });
      
      await goalService.archiveGoal(goalId, isArchived);
      setGoalLoading(goalId, false);
    } catch (error) {
      setGoalLoading(goalId, false);
      // Revert optimistic update on error
      if (currentGoal) {
        dispatch({ 
          type: actionTypes.ARCHIVE_GOAL, 
          payload: { 
            goalId, 
            isArchived: currentGoal.isArchived, 
            archivedAt: currentGoal.archivedAt 
          } 
        });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [setGoalLoading, state.goals]);
  
  const updateMilestone = useCallback(async (goalId, milestoneId, milestoneData) => {
    // Store current goal for potential rollback
    const currentGoal = state.goals.find(goal => goal._id === goalId);
    const currentGoalDetail = state.currentGoal;
    
    try {
      // Set individual milestone loading
      setMilestoneLoading(milestoneId, true);
      
      // Optimistic update - immediately update the UI
      if (currentGoal) {
        const updatedMilestones = currentGoal.milestones.map(milestone => 
          milestone._id === milestoneId 
            ? { ...milestone, ...milestoneData }
            : milestone
        );
        
        // Calculate new progress
        const completedMilestones = updatedMilestones.filter(m => m.status === 'completed').length;
        const totalMilestones = updatedMilestones.length;
        const newProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
        
        const optimisticGoal = {
          ...currentGoal,
          milestones: updatedMilestones,
          progress: {
            ...currentGoal.progress,
            milestonesCompleted: completedMilestones,
            totalMilestones: totalMilestones,
            overall: newProgress
          }
        };
        
        dispatch({ type: actionTypes.UPDATE_GOAL, payload: optimisticGoal });
        
        // Also update currentGoal if it's the same goal
        if (currentGoalDetail && currentGoalDetail._id === goalId) {
          dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: optimisticGoal });
        }
      }
      
      const response = await goalService.updateMilestone(goalId, milestoneId, milestoneData);
      
      // Update with server response
      const updatedGoal = response.data?.data || response.data;
      if (updatedGoal && updatedGoal._id) {
        dispatch({ type: actionTypes.UPDATE_GOAL, payload: updatedGoal });
        if (state.currentGoal && state.currentGoal._id === goalId) {
          dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: updatedGoal });
        }
      }
      
      setMilestoneLoading(milestoneId, false);
      return updatedGoal;
    } catch (error) {
      setMilestoneLoading(milestoneId, false);
      // Revert optimistic update on error
      if (currentGoal) {
        dispatch({ type: actionTypes.UPDATE_GOAL, payload: currentGoal });
      }
      if (currentGoalDetail && currentGoalDetail._id === goalId) {
        dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: currentGoalDetail });
      }
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.goals, state.currentGoal, setMilestoneLoading]);
  
  const getGoalById = useCallback(async (goalId) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      console.log('Fetching goal with ID:', goalId);
      
      // Check if we already have this goal in context to avoid unnecessary API calls
      const existingGoal = state.goals.find(goal => goal._id === goalId);
      if (existingGoal && !existingGoal.needsRefresh) {
        console.log('Using existing goal from context');
        dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: existingGoal });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        return existingGoal;
      }
      
      const response = await goalService.getGoalById(goalId);
      console.log('Goal API response:', response);
      
      // Handle different response structures
      const goalData = response.data?.data || response.data;
      console.log('Processed goal data:', goalData);
      
      if (goalData && goalData._id) {
        dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: goalData });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        return goalData;
      } else {
        console.error('Invalid goal data received:', goalData);
        // Fallback: try to get goal from existing goals list
        if (existingGoal) {
          console.log('Using existing goal from context as fallback');
          dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: existingGoal });
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
          return existingGoal;
        }
        dispatch({ type: actionTypes.SET_ERROR, payload: 'Invalid goal data received' });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        throw new Error('Invalid goal data received');
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        console.log('Request timed out, using fallback data');
        const existingGoal = state.goals.find(goal => goal._id === goalId);
        if (existingGoal) {
          console.log('Using existing goal from context as fallback after timeout');
          dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: existingGoal });
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
          return existingGoal;
        }
        dispatch({ type: actionTypes.SET_ERROR, payload: 'Request timed out. Please try again.' });
      } else {
        // Fallback: try to get goal from existing goals list
        const existingGoal = state.goals.find(goal => goal._id === goalId);
        if (existingGoal) {
          console.log('Using existing goal from context as fallback after error');
          dispatch({ type: actionTypes.SET_CURRENT_GOAL, payload: existingGoal });
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
          return existingGoal;
        }
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
      
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      throw error;
    }
  }, [state.goals]);
  
  const fetchJourneys = useCallback(async (filters = {}) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await goalService.getJourneys(filters);
      dispatch({ type: actionTypes.SET_JOURNEYS, payload: response.data });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  }, []);
  
  const createJourney = useCallback(async (goalId) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await goalService.createJourney(goalId);
      dispatch({ type: actionTypes.ADD_JOURNEY, payload: response.data });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);
  
  const getJourneyById = useCallback(async (journeyId) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await goalService.getJourneyById(journeyId);
      dispatch({ type: actionTypes.SET_CURRENT_JOURNEY, payload: response.data });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);
  
  const updateGoalProgress = useCallback(async (goalId, progressData) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await goalService.updateGoalProgress(goalId, progressData);
      dispatch({ type: actionTypes.UPDATE_PROGRESS, payload: response.data });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return response.data;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);
  
  const fetchAnalytics = useCallback(async (timeRange = 'all') => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      const response = await goalService.getAnalytics(timeRange);
      dispatch({ type: actionTypes.SET_ANALYTICS, payload: response.data });
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  }, []);
  
  const setFilters = useCallback((filters) => {
    dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
  }, []);
  
  const resetState = useCallback(() => {
    dispatch({ type: actionTypes.RESET_STATE });
  }, []);

  const actions = useMemo(() => ({
    setLoading,
    setCurrentGoal,
    setError,
    clearError,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    updateMilestone,
    getGoalById,
    fetchJourneys,
    createJourney,
    getJourneyById,
    updateGoalProgress,
    fetchAnalytics,
    setFilters,
    resetState
  }), [
    setLoading,
    setCurrentGoal,
    setError,
    clearError,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    updateMilestone,
    getGoalById,
    fetchJourneys,
    createJourney,
    getJourneyById,
    updateGoalProgress,
    fetchAnalytics,
    setFilters,
    resetState
  ]);

  // Load initial data only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
      fetchAnalytics();
    } else {
      // Reset state when not authenticated
      dispatch({ type: actionTypes.RESET_STATE });
    }
  }, [isAuthenticated, fetchGoals, fetchAnalytics]);

  const value = {
    ...state,
    ...actions,
    setGoalLoading,
    setMilestoneLoading,
    setCurrentGoal
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
};

// Custom hook
export const useGoals = () => {
  const context = useContext(GoalContext);
  if (!context) {
    // Return default values instead of throwing error to prevent crashes
    return {
      goals: [],
      journeys: [],
      currentGoal: null,
      currentJourney: null,
      progress: { overall: 0, goalsCompleted: 0, totalGoals: 0, milestonesCompleted: 0, totalMilestones: 0 },
      analytics: { totalGoals: 0, activeGoals: 0, completedGoals: 0, overdueGoals: 0, averageProgress: 0, goalsByCategory: {}, goalsByComplexity: {}, goalsByStatus: {} },
      loading: false,
      error: null,
      filters: { status: 'all', category: 'all', complexity: 'all', isArchived: false },
      fetchGoals: () => {},
      createGoal: () => {},
      updateGoal: () => {},
      deleteGoal: () => {},
      archiveGoal: () => {},
      fetchAnalytics: () => {},
      setFilters: () => {},
      resetState: () => {}
    };
  }
  return context;
};

export default GoalContext;
