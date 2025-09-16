import React, { useState, useEffect } from 'react';
import { useCheckIns } from '../context/CheckInContext';
import { useGoals } from '../context/GoalContext';
import CheckInList from '../components/checkin/CheckInList';
import CheckInStatistics from '../components/checkin/CheckInStatistics';
import CheckInCalendar from '../components/checkin/CheckInCalendar';
import './CheckIn.css';

const CheckIn = () => {
  const { 
    upcomingCheckins, 
    overdueCheckins, 
    statistics,
    fetchUpcomingCheckins,
    fetchOverdueCheckins,
    fetchStatistics
  } = useCheckIns();
  
  const { goals } = useGoals();
  const [activeTab, setActiveTab] = useState('list');
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchUpcomingCheckins(5);
    fetchOverdueCheckins();
    fetchStatistics(timeRange);
  }, [fetchUpcomingCheckins, fetchOverdueCheckins, fetchStatistics, timeRange]);

  const getUpcomingCount = () => {
    return upcomingCheckins.length;
  };

  const getOverdueCount = () => {
    return overdueCheckins.length;
  };

  const getCompletionRate = () => {
    return statistics.completionRate || 0;
  };

  const getAverageRating = () => {
    return statistics.averageRating || 0;
  };

  const getActiveGoalsCount = () => {
    return goals.filter(goal => goal.status === 'active').length;
  };

  const tabs = [
    { id: 'list', label: 'All Check-ins', icon: '📋' },
    { id: 'calendar', label: 'Calendar', icon: '📅' },
    { id: 'statistics', label: 'Statistics', icon: '📊' }
  ];

  return (
    <div className="checkin-page">
      <div className="checkin-header">
        <div className="checkin-title-section">
          <h1>Check-in System</h1>
          <p>Track your progress and stay accountable to your goals</p>
        </div>
        
        <div className="checkin-quick-stats">
          <div className="quick-stat">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-value">{getUpcomingCount()}</div>
              <div className="stat-label">Upcoming</div>
            </div>
          </div>
          
          <div className="quick-stat">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value">{getOverdueCount()}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
          
          <div className="quick-stat">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{getCompletionRate()}%</div>
              <div className="stat-label">Completion Rate</div>
            </div>
          </div>
          
          <div className="quick-stat">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{getAverageRating().toFixed(1)}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      <div className="checkin-navigation">
        <div className="tab-list">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {activeTab === 'statistics' && (
          <div className="time-range-selector">
            <label htmlFor="timeRange">Time Range:</label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        )}
      </div>

      <div className="checkin-content">
        {activeTab === 'list' && (
          <div className="checkin-list-view">
            {getOverdueCount() > 0 && (
              <div className="overdue-alert">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <h3>You have {getOverdueCount()} overdue check-in{getOverdueCount() !== 1 ? 's' : ''}</h3>
                  <p>Complete or reschedule them to stay on track with your goals.</p>
                </div>
              </div>
            )}
            
            <CheckInList />
          </div>
        )}
        
        {activeTab === 'calendar' && (
          <div className="checkin-calendar-view">
            <CheckInCalendar />
          </div>
        )}
        
        {activeTab === 'statistics' && (
          <div className="checkin-statistics-view">
            <CheckInStatistics timeRange={timeRange} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
