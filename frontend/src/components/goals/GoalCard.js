import React from 'react';
import { Link } from 'react-router-dom';
import './GoalCard.css';

const GoalCard = ({ goal, onUpdate, onDelete, onArchive, isLoading = false }) => {
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
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (targetDate) => {
    return new Date(targetDate) < new Date() && goal.status !== 'completed';
  };

  return (
    <div className={`goal-card ${isLoading ? 'loading' : ''} ${goal.isArchived ? 'archived' : ''}`}>
      {isLoading && (
        <div className="goal-card-loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      <div className={`goal-card-inner ${isOverdue(goal.targetDate) ? 'overdue' : ''}`}>
      <div className="goal-card-header">
        <div className="goal-title-section">
          <h3 className="goal-title">{goal.title}</h3>
          <div className="goal-badges">
            <span 
              className="status-badge"
              style={{ backgroundColor: getStatusColor(goal.status) }}
            >
              {goal.status}
            </span>
            <span 
              className="priority-badge"
              style={{ backgroundColor: getPriorityColor(goal.priority) }}
            >
              {goal.priority}
            </span>
            <span 
              className="complexity-badge"
              style={{ backgroundColor: getComplexityColor(goal.complexity) }}
            >
              {goal.complexity}
            </span>
            {goal.isArchived && (
              <span className="archived-badge">
                Archived
              </span>
            )}
          </div>
        </div>
        <div className="goal-actions">
          <button 
            className="action-btn edit-btn"
            onClick={() => onUpdate(goal)}
            title="Edit Goal"
          >
            Edit
          </button>
          <button 
            className="action-btn archive-btn"
            onClick={() => onArchive(goal._id, !goal.isArchived)}
            title={goal.isArchived ? "Unarchive" : "Archive"}
          >
            {goal.isArchived ? "Unarchive" : "Archive"}
          </button>
          <button 
            className="action-btn delete-btn"
            onClick={() => onDelete(goal._id)}
            title="Delete Goal"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="goal-card-body">
        <p className="goal-description">{goal.description}</p>
        
        <div className="goal-meta">
          <div className="meta-item">
            <span className="meta-label">Category:</span>
            <span className="meta-value">{goal.category}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Target Date:</span>
            <span className={`meta-value ${isOverdue(goal.targetDate) ? 'overdue' : ''}`}>
              {formatDate(goal.targetDate)}
            </span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Timeline:</span>
            <span className="meta-value">{goal.suggestedTimeline}</span>
          </div>
        </div>

        {goal.tags && goal.tags.length > 0 && (
          <div className="goal-tags">
            {goal.tags.map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="goal-progress">
          <div className="progress-header">
            <span className="progress-label">Progress</span>
            <span className="progress-percentage">
              {goal.progress?.overall || 0}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${goal.progress?.overall || 0}%` }}
            ></div>
          </div>
          <div className="progress-details">
            <span className="milestones-completed">
              {goal.progress?.milestonesCompleted || 0} of {goal.progress?.totalMilestones || 0} milestones
            </span>
          </div>
        </div>
      </div>

      <div className="goal-card-footer">
        <Link 
          to={`/goals/${goal._id}`} 
          className="view-details-btn"
        >
          View Details
        </Link>
        {goal.journeys && goal.journeys.length > 0 && (
          <Link 
            to={`/goals/${goal._id}/journey`} 
            className="view-journey-btn"
          >
            View Journey
          </Link>
        )}
      </div>
      </div>
    </div>
  );
};

export default GoalCard;
