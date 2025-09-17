import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoals } from '../context/GoalContext';
import GoalForm from '../components/goals/GoalForm';
import MilestoneStatus from '../components/goals/MilestoneStatus';
import './GoalDetail.css';

const GoalDetail = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const {
    currentGoal,
    loading,
    loadingGoals,
    loadingMilestones,
    error,
    getGoalById,
    updateGoal,
    updateMilestone,
    deleteGoal,
    createJourney,
    clearError
  } = useGoals();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showJourneyForm, setShowJourneyForm] = useState(false);

  useEffect(() => {
    if (goalId) {
      getGoalById(goalId);
    }
    return () => clearError();
  }, [goalId, getGoalById, clearError]);

  const handleUpdateGoal = async (goalData) => {
    try {
      console.log('GoalDetail - Updating goal with ID:', goalId, 'Data:', goalData);
      const updatedGoal = await updateGoal(goalId, goalData);
      console.log('GoalDetail - Goal updated successfully:', updatedGoal);
      
      // Refresh the current goal to ensure we have the latest data
      await getGoalById(goalId);
      
      setShowEditForm(false);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async () => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goalId);
        navigate('/goals');
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const handleCreateJourney = async () => {
    try {
      await createJourney(goalId);
      setShowJourneyForm(false);
      // Optionally navigate to journey page
      // navigate(`/goals/${goalId}/journey`);
    } catch (error) {
      console.error('Error creating journey:', error);
    }
  };

  const handleUpdateMilestone = async (milestoneId, milestoneData) => {
    try {
      console.log('Updating milestone:', milestoneId, milestoneData);
      await updateMilestone(goalId, milestoneId, milestoneData);
      console.log('Milestone updated successfully');
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#059669';
      case 'paused': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'draft': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOverdue = (targetDate) => {
    return new Date(targetDate) < new Date() && currentGoal?.status !== 'completed';
  };

  if (loading) {
    return (
      <div className="goal-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading goal details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="goal-detail-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Goal</h3>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={() => getGoalById(goalId)}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentGoal) {
    return (
      <div className="goal-detail-not-found">
        <div className="not-found-icon">🎯</div>
        <h3>Goal Not Found</h3>
        <p>The goal you're looking for doesn't exist or has been deleted.</p>
        <button 
          className="back-btn"
          onClick={() => navigate('/goals')}
        >
          Back to Goals
        </button>
      </div>
    );
  }

  return (
    <div className="goal-detail">
      {/* Header */}
      <div className="goal-detail-header">
        <div className="header-content">
          <div className="goal-title-section">
            <h1 className="goal-title">{currentGoal.title}</h1>
            <div className="goal-badges">
              <span 
                className="status-badge" 
                style={{ backgroundColor: getStatusColor(currentGoal.status) }}
              >
                {currentGoal.status}
              </span>
              <span 
                className="priority-badge" 
                style={{ backgroundColor: getPriorityColor(currentGoal.priority) }}
              >
                {currentGoal.priority}
              </span>
            <span 
              className="complexity-badge"
              style={{ backgroundColor: getComplexityColor(currentGoal.complexity) }}
            >
                {currentGoal.complexity}
              </span>
            </div>
          </div>
          <div className="goal-actions">
            <button 
              className="action-btn edit-btn"
              onClick={() => setShowEditForm(true)}
            >
              Edit
            </button>
            <button 
              className="action-btn journey-btn"
              onClick={() => setShowJourneyForm(true)}
            >
              Create Journey
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={handleDeleteGoal}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="goal-detail-content">
        <div className="goal-info-grid">
          {/* Description */}
          <div className="info-card description-card">
            <h3>Description</h3>
            <p>{currentGoal.description}</p>
          </div>

          {/* Progress */}
          <div className="info-card progress-card">
            <h3>Progress</h3>
            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Overall Progress</span>
                <span className="progress-percentage">
                  {currentGoal.progress?.overall || 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${currentGoal.progress?.overall || 0}%`,
                    transition: 'width 0.5s ease-in-out'
                  }}
                ></div>
              </div>
              <div className="progress-details">
                <div className="progress-item">
                  <span className="progress-item-label">Milestones Completed:</span>
                  <span className="progress-item-value">
                    {currentGoal.progress?.milestonesCompleted || 0} of {currentGoal.progress?.totalMilestones || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="info-card timeline-card">
            <h3>Timeline</h3>
            <div className="timeline-info">
              <div className="timeline-item">
                <span className="timeline-label">Target Date:</span>
                <span className={`timeline-value ${isOverdue(currentGoal.targetDate) ? 'overdue' : ''}`}>
                  {formatDate(currentGoal.targetDate)}
                </span>
              </div>
              <div className="timeline-item">
                <span className="timeline-label">Suggested Timeline:</span>
                <span className="timeline-value">{currentGoal.suggestedTimeline}</span>
              </div>
              <div className="timeline-item">
                <span className="timeline-label">Created:</span>
                <span className="timeline-value">{formatDate(currentGoal.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="info-card details-card">
            <h3>Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{currentGoal.category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Complexity:</span>
                <span className="detail-value">{currentGoal.complexity}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Priority:</span>
                <span className="detail-value">{currentGoal.priority}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Public:</span>
                <span className="detail-value">
                  {currentGoal.isPublic ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {currentGoal.tags && currentGoal.tags.length > 0 && (
            <div className="info-card tags-card">
              <h3>Tags</h3>
              <div className="tags-list">
                {currentGoal.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          {currentGoal.milestones && currentGoal.milestones.length > 0 && (
            <div className="info-card milestones-card">
              <h3>Milestones</h3>
              <div className="milestones-list">
                {currentGoal.milestones.map((milestone, index) => (
                  <div key={milestone._id || index} className="milestone-item">
                    <div className="milestone-header">
                      <span className="milestone-title">{milestone.title}</span>
                      <MilestoneStatus
                        milestone={milestone}
                        onUpdate={handleUpdateMilestone}
                        isLoading={loadingMilestones[milestone._id] || false}
                      />
                    </div>
                    <p className="milestone-description">{milestone.description}</p>
                    <div className="milestone-meta">
                      <span className="milestone-date">
                        Due: {formatDate(milestone.targetDate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <GoalForm
          goal={currentGoal}
          onSubmit={handleUpdateGoal}
          onCancel={() => setShowEditForm(false)}
          isEditing={true}
        />
      )}

      {/* Journey Creation Modal */}
      {showJourneyForm && (
        <div className="journey-form-overlay">
          <div className="journey-form-container">
            <div className="journey-form-header">
              <h2>Create Learning Journey</h2>
              <button 
                className="close-btn"
                onClick={() => setShowJourneyForm(false)}
              >
                ✕
              </button>
            </div>
            <div className="journey-form-content">
              <p>This will create a structured learning journey for your goal with organized chunks and learning objectives.</p>
              <div className="journey-form-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowJourneyForm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="create-btn"
                  onClick={handleCreateJourney}
                >
                  Create Journey
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalDetail;
