import React, { useState } from 'react';
import './CheckInFilters.css';

const CheckInFilters = ({ filters, goals, onFilterChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleDateChange = (key, value) => {
    onFilterChange({ [key]: value || null });
  };

  const clearFilters = () => {
    onFilterChange({
      status: 'all',
      goal: 'all',
      frequency: 'all',
      startDate: null,
      endDate: null
    });
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' || 
           filters.goal !== 'all' || 
           filters.frequency !== 'all' ||
           filters.startDate !== null ||
           filters.endDate !== null;
  };

  return (
    <div className="checkin-filters">
      <div className="filters-header">
        <h3>Filters</h3>
        <div className="filters-actions">
          {hasActiveFilters() && (
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              Clear All
            </button>
          )}
          <button 
            className={`toggle-advanced-btn ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>
      </div>

      <div className="filters-content">
        <div className="basic-filters">
          <div className="filter-group">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="goal-filter">Goal</label>
            <select
              id="goal-filter"
              value={filters.goal}
              onChange={(e) => handleFilterChange('goal', e.target.value)}
            >
              <option value="all">All Goals</option>
              {goals.map(goal => (
                <option key={goal._id} value={goal._id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="frequency-filter">Frequency</label>
            <select
              id="frequency-filter"
              value={filters.frequency}
              onChange={(e) => handleFilterChange('frequency', e.target.value)}
            >
              <option value="all">All Frequencies</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {showAdvanced && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label htmlFor="start-date-filter">Start Date</label>
              <input
                type="date"
                id="start-date-filter"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="end-date-filter">End Date</label>
              <input
                type="date"
                id="end-date-filter"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters() && (
        <div className="active-filters">
          <span className="active-filters-label">Active filters:</span>
          {filters.status !== 'all' && (
            <span className="filter-tag">
              Status: {filters.status}
              <button onClick={() => handleFilterChange('status', 'all')}>×</button>
            </span>
          )}
          {filters.goal !== 'all' && (
            <span className="filter-tag">
              Goal: {goals.find(g => g._id === filters.goal)?.title || 'Unknown'}
              <button onClick={() => handleFilterChange('goal', 'all')}>×</button>
            </span>
          )}
          {filters.frequency !== 'all' && (
            <span className="filter-tag">
              Frequency: {filters.frequency}
              <button onClick={() => handleFilterChange('frequency', 'all')}>×</button>
            </span>
          )}
          {filters.startDate && (
            <span className="filter-tag">
              From: {new Date(filters.startDate).toLocaleDateString()}
              <button onClick={() => handleDateChange('startDate', null)}>×</button>
            </span>
          )}
          {filters.endDate && (
            <span className="filter-tag">
              To: {new Date(filters.endDate).toLocaleDateString()}
              <button onClick={() => handleDateChange('endDate', null)}>×</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckInFilters;
