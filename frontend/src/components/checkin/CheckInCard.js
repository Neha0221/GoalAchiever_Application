import React, { useState } from 'react';
import { useCheckIns } from '../../context/CheckInContext';
import { useGoals } from '../../context/GoalContext';
import './CheckInCard.css';

const CheckInCard = ({ checkin, onEdit, onComplete, onReschedule, onDelete }) => {
  const { loadingCheckins } = useCheckIns();
  const { goals } = useGoals();
  const [showActions, setShowActions] = useState(false);

  const isLoading = loadingCheckins[checkin._id];
  const goal = goals.find(g => g._id === checkin.goal?._id || g._id === checkin.goal);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'scheduled':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      case 'missed':
        return '#ef4444';
      case 'cancelled':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getFrequencyDisplay = (frequency) => {
    switch (frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'bi-weekly':
        return 'Bi-weekly';
      case 'monthly':
        return 'Monthly';
      case 'custom':
        return 'Custom';
      default:
        return frequency;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = new Date(checkin.scheduledDate) < new Date() && checkin.status === 'scheduled';
  const daysUntil = checkin.nextScheduledDate ? 
    Math.ceil((new Date(checkin.nextScheduledDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const handleComplete = () => {
    if (onComplete) {
      onComplete(checkin);
    }
  };

  const handleReschedule = () => {
    if (onReschedule) {
      onReschedule(checkin);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(checkin._id);
    }
  };

  return (
    <div className={`checkin-card ${isOverdue ? 'overdue' : ''} ${isLoading ? 'loading' : ''}`}>
      <div className="checkin-card-header">
        <div className="checkin-status">
          <span 
            className="status-indicator" 
            style={{ backgroundColor: getStatusColor(checkin.status) }}
          />
          <span className="status-text">{checkin.status}</span>
        </div>
        <div className="checkin-frequency">
          {getFrequencyDisplay(checkin.frequency)}
        </div>
        <button 
          className="actions-toggle"
          onClick={() => setShowActions(!showActions)}
          disabled={isLoading}
        >
          ⋯
        </button>
      </div>

      <div className="checkin-card-content">
        <h3 className="checkin-title">{checkin.title}</h3>
        {checkin.description && (
          <p className="checkin-description">{checkin.description}</p>
        )}
        
        {goal && (
          <div className="checkin-goal">
            <span className="goal-label">Goal:</span>
            <span className="goal-title">{goal.title}</span>
          </div>
        )}

        <div className="checkin-dates">
          <div className="scheduled-date">
            <span className="date-label">Scheduled:</span>
            <span className="date-value">{formatDate(checkin.scheduledDate)}</span>
          </div>
          
          {checkin.completedDate && (
            <div className="completed-date">
              <span className="date-label">Completed:</span>
              <span className="date-value">{formatDate(checkin.completedDate)}</span>
            </div>
          )}
          
          {checkin.nextScheduledDate && (
            <div className="next-date">
              <span className="date-label">Next:</span>
              <span className="date-value">
                {formatDate(checkin.nextScheduledDate)}
                {daysUntil !== null && (
                  <span className="days-until">({daysUntil} days)</span>
                )}
              </span>
            </div>
          )}
        </div>

        {checkin.progressAssessment && (
          <div className="progress-assessment">
            <div className="assessment-summary">
              <span className="progress-label">Progress:</span>
              <span className="progress-value">
                {checkin.progressAssessment.overallProgress}%
              </span>
            </div>
            {checkin.progressAssessment.rating && (
              <div className="rating">
                <span className="rating-label">Rating:</span>
                <span className="rating-value">
                  {checkin.progressAssessment.rating}/10
                </span>
              </div>
            )}
          </div>
        )}

        {isOverdue && (
          <div className="overdue-warning">
            ⚠️ This check-in is overdue
          </div>
        )}

      </div>

      {showActions && (
        <div className="checkin-actions">
          {checkin.status === 'scheduled' && (
            <>
              <button 
                className="action-btn complete-btn"
                onClick={handleComplete}
                disabled={isLoading}
              >
                Complete
              </button>
              <button 
                className="action-btn reschedule-btn"
                onClick={handleReschedule}
                disabled={isLoading}
              >
                Reschedule
              </button>
            </>
          )}
          
          {checkin.status === 'scheduled' && isOverdue && (
            <button 
              className="action-btn miss-btn"
              onClick={() => {/* Handle mark as missed */}}
              disabled={isLoading}
            >
              Mark as Missed
            </button>
          )}
          
          <button 
            className="action-btn edit-btn"
            onClick={() => onEdit && onEdit(checkin)}
            disabled={isLoading}
          >
            Edit
          </button>
          
          <button 
            className="action-btn delete-btn"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default CheckInCard;
