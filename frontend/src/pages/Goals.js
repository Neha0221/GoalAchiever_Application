import React, { useEffect } from 'react';
import { useGoals } from '../context/GoalContext';
import GoalList from '../components/goals/GoalList';
import './Goals.css';

const Goals = () => {
  const {
    goals,
    loading,
    loadingGoals,
    error,
    filters,
    createGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    setFilters,
    fetchGoals,
    clearError
  } = useGoals();

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError();
  }, [clearError]);

  const handleCreateGoal = async (goalData) => {
    try {
      await createGoal(goalData);
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  };

  const handleUpdateGoal = async (goalId, goalData) => {
    try {
      console.log('Goals page - Updating goal with ID:', goalId, 'Data:', goalData);
      await updateGoal(goalId, goalData);
      console.log('Goals page - Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await deleteGoal(goalId);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  };

  const handleArchiveGoal = async (goalId, isArchived) => {
    try {
      await archiveGoal(goalId, isArchived);
    } catch (error) {
      console.error('Error archiving goal:', error);
      throw error;
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Refetch goals with new filters
    fetchGoals({ ...filters, ...newFilters });
  };

  return (
    <div className="goals-page">
      <div className="goals-page-header">
        <div className="page-title">
          <h1>Goal Management</h1>
          <p>Set, track, and achieve your personal and professional goals</p>
        </div>
      </div>

      <div className="goals-page-content">
        <GoalList
          goals={goals}
          loading={loading}
          loadingGoals={loadingGoals}
          error={error}
          onCreateGoal={handleCreateGoal}
          onUpdateGoal={handleUpdateGoal}
          onDeleteGoal={handleDeleteGoal}
          onArchiveGoal={handleArchiveGoal}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
};

export default Goals;
