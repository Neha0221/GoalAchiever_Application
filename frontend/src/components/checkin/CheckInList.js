import React, { useState, useEffect } from 'react';
import { useCheckIns } from '../../context/CheckInContext';
import { useGoals } from '../../context/GoalContext';
import { useAuth } from '../../context/AuthContext';
import CheckInCard from './CheckInCard';
import CheckInForm from './CheckInForm';
import CheckInFilters from './CheckInFilters';
import './CheckInList.css';

const CheckInList = ({ showFilters = true, showCreateButton = true }) => {
  const { 
    checkins, 
    loading, 
    error, 
    filters, 
    pagination,
    fetchCheckins,
    createCheckin,
    deleteCheckin,
    setFilters,
    setPagination
  } = useCheckIns();
  
  const { goals } = useGoals();
  const { isAuthenticated, user, token } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingCheckin, setEditingCheckin] = useState(null);
  const [completingCheckin, setCompletingCheckin] = useState(null);
  const [reschedulingCheckin, setReschedulingCheckin] = useState(null);


  useEffect(() => {
    if (isAuthenticated) {
      fetchCheckins(filters);
    }
  }, [filters, fetchCheckins, isAuthenticated]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({ current: 1 }); // Reset to first page when filtering
  };

  const handlePageChange = (page) => {
    setPagination({ current: page });
    fetchCheckins({ ...filters, page });
  };

  const handleCreateCheckin = () => {
    setEditingCheckin(null);
    setShowForm(true);
  };

  const handleEditCheckin = (checkin) => {
    setEditingCheckin(checkin);
    setShowForm(true);
  };

  const handleCompleteCheckin = (checkin) => {
    setCompletingCheckin(checkin);
  };

  const handleRescheduleCheckin = (checkin) => {
    setReschedulingCheckin(checkin);
  };

  const handleDeleteCheckin = async (checkinId) => {
    if (window.confirm('Are you sure you want to delete this check-in?')) {
      try {
        await deleteCheckin(checkinId);
      } catch (error) {
        console.error('Error deleting check-in:', error);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCheckin(null);
    setCompletingCheckin(null);
    setReschedulingCheckin(null);
  };

  const handleFormSubmit = () => {
    handleFormClose();
    // The createCheckin function now handles refreshing the data
    // No need to manually refresh here
  };

  const handleRetry = () => {
    fetchCheckins(filters);
  };

  const getFilteredCheckins = () => {
    if (!Array.isArray(checkins)) return [];
    
    return checkins.filter(checkin => {
      // Status filter
      if (filters.status !== 'all' && checkin.status !== filters.status) {
        return false;
      }
      
      // Goal filter
      if (filters.goal !== 'all') {
        const goalId = checkin.goal?._id || checkin.goal;
        if (goalId !== filters.goal) {
          return false;
        }
      }
      
      // Frequency filter
      if (filters.frequency !== 'all' && checkin.frequency !== filters.frequency) {
        return false;
      }
      
      // Date range filter
      if (filters.startDate) {
        const checkinDate = new Date(checkin.scheduledDate);
        const startDate = new Date(filters.startDate);
        if (checkinDate < startDate) {
          return false;
        }
      }
      
      if (filters.endDate) {
        const checkinDate = new Date(checkin.scheduledDate);
        const endDate = new Date(filters.endDate);
        if (checkinDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredCheckins = getFilteredCheckins();

  const getStatusCounts = () => {
    const counts = { scheduled: 0, completed: 0, missed: 0, pending: 0, cancelled: 0 };
    filteredCheckins.forEach(checkin => {
      counts[checkin.status] = (counts[checkin.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading && checkins.length === 0) {
    return (
      <div className="checkin-list">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading check-ins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-list">
      <div className="checkin-list-header">
        <div className="checkin-list-title">
          <h2>Check-ins</h2>
          <div className="status-summary">
            {Object.entries(statusCounts).map(([status, count]) => 
              count > 0 ? (
                <span key={status} className={`status-count ${status}`}>
                  {count} {status}
                </span>
              ) : null
            )}
          </div>
        </div>
        
        {showCreateButton && (
          <div>
            <button 
              className="create-checkin-btn"
              onClick={handleCreateCheckin}
            >
              + Create Check-in
            </button>
          </div>
        )}
      </div>


      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={handleRetry}>Retry</button>
        </div>
      )}

      {showFilters && (
        <CheckInFilters
          filters={filters}
          goals={goals}
          onFilterChange={handleFilterChange}
        />
      )}

      {filteredCheckins.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No check-ins found</h3>
          <p>
            {Object.values(filters).some(f => f !== 'all' && f !== null) 
              ? 'Try adjusting your filters to see more check-ins.'
              : 'Create your first check-in to start tracking your progress.'
            }
          </p>
          {showCreateButton && (
            <button 
              className="create-first-checkin-btn"
              onClick={handleCreateCheckin}
            >
              Create Your First Check-in
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="checkin-grid">
            {filteredCheckins.map((checkin, index) => (
              <CheckInCard
                key={checkin._id || `checkin-${index}`}
                checkin={checkin}
                onEdit={handleEditCheckin}
                onComplete={handleCompleteCheckin}
                onReschedule={handleRescheduleCheckin}
                onDelete={handleDeleteCheckin}
              />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current <= 1}
              >
                Previous
              </button>
              
              <div className="pagination-info">
                Page {pagination.current} of {pagination.pages}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current >= pagination.pages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <CheckInForm
          checkin={editingCheckin}
          completingCheckin={completingCheckin}
          reschedulingCheckin={reschedulingCheckin}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default CheckInList;
