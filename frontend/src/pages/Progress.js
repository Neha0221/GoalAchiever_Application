import React, { useEffect, useState } from 'react';
import { useGoals } from '../context/GoalContext';
import './Progress.css';

const Progress = () => {
  const {
    goals,
    analytics,
    loading,
    error,
    fetchAnalytics,
    fetchGoals
  } = useGoals();

  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchAnalytics(timeRange);
    fetchGoals();
  }, [timeRange, fetchAnalytics, fetchGoals]);

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#3b82f6';
    return '#ef4444';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'completed': return '✅';
      case 'paused': return '⏸️';
      case 'cancelled': return '❌';
      case 'draft': return '📝';
      default: return '❓';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (targetDate, status) => {
    return new Date(targetDate) < new Date() && status !== 'completed';
  };

  const getOverdueGoals = () => {
    if (!Array.isArray(goals)) return [];
    return goals.filter(goal => isOverdue(goal.targetDate, goal.status));
  };

  const getRecentGoals = () => {
    if (!Array.isArray(goals)) return [];
    return goals
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  };

  const getTopPerformingGoals = () => {
    if (!Array.isArray(goals)) return [];
    return goals
      .filter(goal => goal.progress?.overall > 0)
      .sort((a, b) => (b.progress?.overall || 0) - (a.progress?.overall || 0))
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="progress-loading">
        <div className="loading-spinner"></div>
        <p>Loading progress data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-error">
        <div className="error-icon">⚠️</div>
        <h3>Error Loading Progress</h3>
        <p>{error}</p>
        <button 
          className="retry-btn"
          onClick={() => fetchAnalytics(timeRange)}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="progress-page">
      <div className="progress-page-header">
        <div className="page-title">
          <h1>Progress Dashboard</h1>
          <p>Track your progress and analyze your goal achievement patterns</p>
        </div>
        <div className="time-range-selector">
          <label htmlFor="timeRange">Time Range:</label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      <div className="progress-page-content">
        {/* Analytics Overview */}
        <div className="analytics-overview">
          <h2>Overview</h2>
          <div className="analytics-grid">
            <div className="analytics-card">
              <div className="analytics-icon">🎯</div>
              <div className="analytics-content">
                <h3>Total Goals</h3>
                <p className="analytics-number">{analytics.totalGoals}</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">🟢</div>
              <div className="analytics-content">
                <h3>Active Goals</h3>
                <p className="analytics-number">{analytics.activeGoals}</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">✅</div>
              <div className="analytics-content">
                <h3>Completed</h3>
                <p className="analytics-number">{analytics.completedGoals}</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">⚠️</div>
              <div className="analytics-content">
                <h3>Overdue</h3>
                <p className="analytics-number">{analytics.overdueGoals}</p>
              </div>
            </div>
            <div className="analytics-card">
              <div className="analytics-icon">📊</div>
              <div className="analytics-content">
                <h3>Avg Progress</h3>
                <p className="analytics-number">{analytics.averageProgress}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Visualizations */}
        <div className="charts-section">
          <div className="chart-container">
            <h3>Goals by Category</h3>
            <div className="category-chart">
              {Object.entries(analytics.goalsByCategory || {}).map(([category, count]) => (
                <div key={category} className="category-item">
                  <div className="category-info">
                    <span className="category-name">{category}</span>
                    <span className="category-count">{count}</span>
                  </div>
                  <div className="category-bar">
                    <div 
                      className="category-fill"
                      style={{ 
                        width: `${(count / analytics.totalGoals) * 100}%`,
                        backgroundColor: getProgressColor((count / analytics.totalGoals) * 100)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <h3>Goals by Status</h3>
            <div className="status-chart">
              {Object.entries(analytics.goalsByStatus || {}).map(([status, count]) => (
                <div key={status} className="status-item">
                  <div className="status-info">
                    <span className="status-icon">{getStatusIcon(status)}</span>
                    <span className="status-name">{status}</span>
                    <span className="status-count">{count}</span>
                  </div>
                  <div className="status-bar">
                    <div 
                      className="status-fill"
                      style={{ 
                        width: `${(count / analytics.totalGoals) * 100}%`,
                        backgroundColor: getProgressColor((count / analytics.totalGoals) * 100)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Goals Lists */}
        <div className="goals-lists">
          <div className="goals-list-section">
            <h3>Recent Goals</h3>
            <div className="goals-list">
              {getRecentGoals().map(goal => (
                <div key={goal._id} className="goal-item">
                  <div className="goal-info">
                    <div className="goal-header">
                      <h4 className="goal-title">{goal.title}</h4>
                      <div className="goal-badges">
                        <span className="status-badge">{getStatusIcon(goal.status)} {goal.status}</span>
                        <span className="priority-badge">{getPriorityIcon(goal.priority)} {goal.priority}</span>
                      </div>
                    </div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${goal.progress?.overall || 0}%`,
                            backgroundColor: getProgressColor(goal.progress?.overall || 0)
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{goal.progress?.overall || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="goals-list-section">
            <h3>Top Performing Goals</h3>
            <div className="goals-list">
              {getTopPerformingGoals().map(goal => (
                <div key={goal._id} className="goal-item">
                  <div className="goal-info">
                    <div className="goal-header">
                      <h4 className="goal-title">{goal.title}</h4>
                      <div className="goal-badges">
                        <span className="status-badge">{getStatusIcon(goal.status)} {goal.status}</span>
                        <span className="priority-badge">{getPriorityIcon(goal.priority)} {goal.priority}</span>
                      </div>
                    </div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${goal.progress?.overall || 0}%`,
                            backgroundColor: getProgressColor(goal.progress?.overall || 0)
                          }}
                        ></div>
                      </div>
                      <span className="progress-text">{goal.progress?.overall || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {getOverdueGoals().length > 0 && (
            <div className="goals-list-section overdue-section">
              <h3>⚠️ Overdue Goals</h3>
              <div className="goals-list">
                {getOverdueGoals().map(goal => (
                  <div key={goal._id} className="goal-item overdue">
                    <div className="goal-info">
                      <div className="goal-header">
                        <h4 className="goal-title">{goal.title}</h4>
                        <div className="goal-badges">
                          <span className="status-badge overdue-badge">⚠️ Overdue</span>
                          <span className="priority-badge">{getPriorityIcon(goal.priority)} {goal.priority}</span>
                        </div>
                      </div>
                      <div className="goal-meta">
                        <span className="due-date">Due: {formatDate(goal.targetDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Progress;
