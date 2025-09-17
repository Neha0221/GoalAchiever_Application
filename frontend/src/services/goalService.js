import { apiEndpoints } from './api';

// Import retry function (we'll need to export it from api.js)
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

// Goal Management Service
export const goalService = {
  // Goals
  getGoals: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/goals?${queryString}` : '/goals';
      const response = await apiEndpoints.goals.getAll(url);
      
      // Ensure we always return an array
      if (response.data && Array.isArray(response.data)) {
        return response;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return { ...response, data: response.data.data };
      } else {
        return { ...response, data: [] };
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      return { data: [] };
    }
  },

  getGoalById: async (goalId) => {
    return await retryRequest(() => apiEndpoints.goals.getById(goalId));
  },

  createGoal: async (goalData) => {
    console.log('GoalService - Creating goal with data:', goalData);
    const response = await apiEndpoints.goals.create(goalData);
    console.log('GoalService - Create goal response:', response);
    return response;
  },

  updateGoal: async (goalId, goalData) => {
    try {
      console.log('Updating goal with ID:', goalId, 'Data:', goalData);
      const response = await apiEndpoints.goals.update(goalId, goalData);
      console.log('Update goal response:', response);
      return response;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  deleteGoal: async (goalId) => {
    return await apiEndpoints.goals.delete(goalId);
  },

  // Milestones
  addMilestone: async (goalId, milestoneData) => {
    return await apiEndpoints.goals.addMilestone(goalId, milestoneData);
  },

  updateMilestone: async (goalId, milestoneId, milestoneData) => {
    return await retryRequest(() => apiEndpoints.goals.updateMilestone(goalId, milestoneId, milestoneData));
  },

  deleteMilestone: async (goalId, milestoneId) => {
    return await apiEndpoints.goals.deleteMilestone(goalId, milestoneId);
  },

  // Progress
  updateGoalProgress: async (goalId, progressData) => {
    return await apiEndpoints.goals.updateProgress(goalId, progressData);
  },

  addGoalNote: async (goalId, noteData) => {
    return await apiEndpoints.goals.addNote(goalId, noteData);
  },

  // Journeys
  getJourneys: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/goals/journeys?${queryString}` : '/goals/journeys';
      const response = await apiEndpoints.goals.getJourneys(url);
      
      // Ensure we always return an array
      if (response.data && Array.isArray(response.data)) {
        return response;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return { ...response, data: response.data.data };
      } else {
        return { ...response, data: [] };
      }
    } catch (error) {
      console.error('Error fetching journeys:', error);
      return { data: [] };
    }
  },

  getJourneyById: async (journeyId) => {
    return await apiEndpoints.goals.getJourneyById(journeyId);
  },

  createJourney: async (goalId) => {
    return await apiEndpoints.goals.createJourney(goalId);
  },

  getJourneysByGoal: async (goalId) => {
    return await apiEndpoints.goals.getJourneysByGoal(goalId);
  },

  // Chunks
  addChunk: async (journeyId, chunkData) => {
    return await apiEndpoints.goals.addChunk(journeyId, chunkData);
  },

  updateChunk: async (journeyId, chunkId, chunkData) => {
    return await apiEndpoints.goals.updateChunk(journeyId, chunkId, chunkData);
  },

  deleteChunk: async (journeyId, chunkId) => {
    return await apiEndpoints.goals.deleteChunk(journeyId, chunkId);
  },

  updateChunkProgress: async (journeyId, chunkId, progressData) => {
    return await apiEndpoints.goals.updateChunkProgress(journeyId, chunkId, progressData);
  },

  addChunkNote: async (journeyId, chunkId, noteData) => {
    return await apiEndpoints.goals.addChunkNote(journeyId, chunkId, noteData);
  },

  getCurrentChunk: async (journeyId) => {
    return await apiEndpoints.goals.getCurrentChunk(journeyId);
  },

  // Learning Objectives
  addObjective: async (journeyId, chunkId, objectiveData) => {
    return await apiEndpoints.goals.addObjective(journeyId, chunkId, objectiveData);
  },

  updateObjective: async (journeyId, chunkId, objectiveId, objectiveData) => {
    return await apiEndpoints.goals.updateObjective(journeyId, chunkId, objectiveId, objectiveData);
  },

  // Analytics
  getAnalytics: async (timeRange = 'all') => {
    const params = new URLSearchParams();
    if (timeRange && timeRange !== 'all') {
      params.append('timeRange', timeRange);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/goals/analytics?${queryString}` : '/goals/analytics';
    return await apiEndpoints.goals.getAnalytics(url);
  },

  getOverdueGoals: async () => {
    return await apiEndpoints.goals.getOverdueGoals();
  },

  getOverdueJourneys: async () => {
    return await apiEndpoints.goals.getOverdueJourneys();
  },

  // Archive
  archiveGoal: async (goalId, isArchived = true) => {
    return await apiEndpoints.goals.archiveGoal(goalId, { isArchived });
  },

  archiveJourney: async (journeyId, isArchived = true) => {
    return await apiEndpoints.goals.archiveJourney(journeyId, { isArchived });
  }
};

export default goalService;
