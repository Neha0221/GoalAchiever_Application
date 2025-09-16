import React, { useState } from 'react';
import './MilestoneStatus.css';

const MilestoneStatus = ({ milestone, onUpdate, isLoading = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(milestone.status);

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#6b7280' },
    { value: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { value: 'completed', label: 'Completed', color: '#10b981' },
    { value: 'overdue', label: 'Overdue', color: '#ef4444' }
  ];

  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdate(milestone._id, { status: newStatus });
      setSelectedStatus(newStatus);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating milestone status:', error);
      // Revert selection on error
      setSelectedStatus(milestone.status);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setSelectedStatus(milestone.status);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedStatus(milestone.status);
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const currentStatus = getStatusInfo(selectedStatus);

  return (
    <div className={`milestone-status ${isLoading ? 'loading' : ''}`}>
      {isEditing ? (
        <div className="status-edit">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="status-select"
            disabled={isLoading}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="status-actions">
            <button
              className="status-btn save-btn"
              onClick={() => handleStatusChange(selectedStatus)}
              disabled={isLoading}
            >
              {isLoading ? '...' : 'Save'}
            </button>
            <button
              className="status-btn cancel-btn"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="status-display">
          <span
            className="status-badge"
            style={{ backgroundColor: currentStatus.color }}
            onClick={handleEditClick}
            title="Click to edit status"
          >
            {currentStatus.label}
          </span>
          <button
            className="edit-status-btn"
            onClick={handleEditClick}
            disabled={isLoading}
            title="Edit milestone status"
          >
            ✏️
          </button>
        </div>
      )}
    </div>
  );
};

export default MilestoneStatus;
