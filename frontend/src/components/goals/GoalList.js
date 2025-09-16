import React, { useState } from 'react';
import GoalCard from './GoalCard';
import GoalForm from './GoalForm';
import './GoalList.css';

const GoalList = ({ 
  goals, 
  loading, 
  loadingGoals = {},
  error, 
  onCreateGoal, 
  onUpdateGoal, 
  onDeleteGoal, 
  onArchiveGoal,
  filters,
  onFilterChange 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const handleCreateGoal = async (goalData) => {
    try {
      await onCreateGoal(goalData);
      setShowForm(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleUpdateGoal = async (goalData) => {
    try {
      await onUpdateGoal(editingGoal._id, goalData);
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await onDeleteGoal(goalId);
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const handleArchiveGoal = async (goalId, isArchived) => {
    try {
      await onArchiveGoal(goalId, isArchived);
    } catch (error) {
      console.error('Error archiving goal:', error);
    }
  };

  const getFilteredGoals = () => {
    if (!Array.isArray(goals)) return [];
    return goals.filter(goal => {
      if (filters.status !== 'all' && goal.status !== filters.status) {
        return false;
      }
      if (filters.category !== 'all' && goal.category !== filters.category) {
        return false;
      }
      if (filters.complexity !== 'all' && goal.complexity !== filters.complexity) {
        return false;
      }
      if (filters.isArchived !== goal.isArchived) {
        return false;
      }
      return true;
    });
  };

  const filteredGoals = getFilteredGoals();

  const getStatusCounts = () => {
    if (!Array.isArray(goals)) {
      return {
        all: 0,
        active: 0,
        completed: 0,
        paused: 0,
        draft: 0
      };
    }
    const counts = {
      all: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      paused: goals.filter(g => g.status === 'paused').length,
      draft: goals.filter(g => g.status === 'draft').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Show loading overlay only if we have no goals yet (initial load)
  const isInitialLoad = loading && (!goals || goals.length === 0);

  if (error) {
    return (
      <div className="goal-list-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Goals</h3>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="goal-list">
      {/* Loading overlay for initial load */}
      {isInitialLoad && (
        <div className="goal-list-loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading goals...</p>
        </div>
      )}
      
      {/* Header */}
      <div className="goal-list-header">
        <div className="header-left">
          <h2>My Goals</h2>
          <p className="goal-count">
            {filteredGoals.length} of {Array.isArray(goals) ? goals.length : 0} goals
          </p>
        </div>
        <div className="header-right">
          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>
          <button
            className="create-goal-btn"
            onClick={() => setShowForm(true)}
          >
            + Create Goal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="goal-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
          >
            <option value="all">All ({statusCounts.all})</option>
            <option value="active">Active ({statusCounts.active})</option>
            <option value="completed">Completed ({statusCounts.completed})</option>
            <option value="paused">Paused ({statusCounts.paused})</option>
            <option value="draft">Draft ({statusCounts.draft})</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="category-filter">Category</label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) => onFilterChange({ category: e.target.value })}
          >
            <option value="all">All Categories</option>
            <option value="learning">Learning</option>
            <option value="career">Career</option>
            <option value="health">Health</option>
            <option value="fitness">Fitness</option>
            <option value="personal">Personal</option>
            <option value="financial">Financial</option>
            <option value="creative">Creative</option>
            <option value="social">Social</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="complexity-filter">Complexity</label>
          <select
            id="complexity-filter"
            value={filters.complexity}
            onChange={(e) => onFilterChange({ complexity: e.target.value })}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.isArchived}
              onChange={(e) => onFilterChange({ isArchived: e.target.checked })}
            />
            <span>Show Archived</span>
          </label>
        </div>
      </div>

      {/* Goals Grid/List */}
      {filteredGoals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <h3>No Goals Found</h3>
          <p>
            {(!Array.isArray(goals) || goals.length === 0)
              ? "You haven't created any goals yet. Start by creating your first goal!"
              : "No goals match your current filters. Try adjusting your search criteria."
            }
          </p>
          {(!Array.isArray(goals) || goals.length === 0) && (
            <button
              className="create-first-goal-btn"
              onClick={() => setShowForm(true)}
            >
              Create Your First Goal
            </button>
          )}
        </div>
      ) : (
        <div className={`goals-container ${viewMode}`}>
          {filteredGoals.map(goal => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onUpdate={setEditingGoal}
              onDelete={handleDeleteGoal}
              onArchive={handleArchiveGoal}
              isLoading={loadingGoals[goal._id] || false}
            />
          ))}
        </div>
      )}

      {/* Goal Form Modal */}
      {showForm && (
        <GoalForm
          onSubmit={handleCreateGoal}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingGoal && (
        <GoalForm
          goal={editingGoal}
          onSubmit={handleUpdateGoal}
          onCancel={() => setEditingGoal(null)}
          isEditing={true}
        />
      )}
    </div>
  );
};

export default GoalList;
