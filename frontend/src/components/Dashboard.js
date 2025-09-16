import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGoals } from '../context/GoalContext';
import { useCheckIns } from '../context/CheckInContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    goals = [], 
    analytics = {}, 
    loading = false, 
    fetchGoals, 
    fetchAnalytics 
  } = useGoals();
  
  const { 
    upcomingCheckins = [], 
    overdueCheckins = [], 
    statistics: checkinStats,
    fetchUpcomingCheckins,
    fetchOverdueCheckins,
    fetchStatistics
  } = useCheckIns();

  useEffect(() => {
    // Only fetch if we have goals context available
    if (fetchGoals && fetchAnalytics) {
      fetchGoals();
      fetchAnalytics();
    }
    
    // Fetch check-in data
    if (fetchUpcomingCheckins && fetchOverdueCheckins && fetchStatistics) {
      fetchUpcomingCheckins(5);
      fetchOverdueCheckins();
      fetchStatistics('month');
    }
  }, [fetchGoals, fetchAnalytics, fetchUpcomingCheckins, fetchOverdueCheckins, fetchStatistics]);

  const getRecentGoals = () => {
    if (!Array.isArray(goals)) return [];
    return goals
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);
  };

  const getOverdueGoals = () => {
    if (!Array.isArray(goals)) return [];
    return goals.filter(goal => 
      new Date(goal.targetDate) < new Date() && goal.status !== 'completed'
    );
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    if (percentage >= 40) return '#3b82f6';
    return '#ef4444';
  };

  // Show loading state if goals context is not ready
  if (!fetchGoals || !fetchAnalytics) {
    return (
      <div className="dashboard">
        <main className="dashboard-main">
          <div className="welcome-section">
            <h2>Welcome back, {user?.firstName}!</h2>
            <p>Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome back, {user?.firstName}!</h2>
          <p>Track your progress and achieve your goals with our comprehensive goal management system.</p>
        </div>

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>{analytics.totalGoals || 0}</h3>
              <p>Total Goals</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <h3>{analytics.activeGoals || 0}</h3>
              <p>Active Goals</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{analytics.completedGoals || 0}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{analytics.averageProgress || 0}%</h3>
              <p>Avg Progress</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>🎯 My Goals</h3>
            <p>Set and track your personal goals</p>
            <Link to="/goals" className="card-button">View Goals</Link>
          </div>

          <div className="dashboard-card">
            <h3>📊 Progress</h3>
            <p>Monitor your progress and achievements</p>
            <Link to="/progress" className="card-button">View Progress</Link>
          </div>

          <div className="dashboard-card">
            <h3>🤖 AI Tutor</h3>
            <p>Get personalized guidance and insights</p>
            <Link to="/ai-tutor" className="card-button">Start Chat</Link>
          </div>

          <div className="dashboard-card">
            <h3>📝 Check-ins</h3>
            <p>Daily check-ins to stay on track</p>
            <Link to="/checkin" className="card-button">Check In</Link>
          </div>
        </div>

        {/* Recent Goals */}
        {!loading && goals.length > 0 && (
          <div className="recent-goals">
            <div className="section-header">
              <h3>Recent Goals</h3>
              <Link to="/goals" className="view-all-link">View All</Link>
            </div>
            <div className="goals-preview">
              {getRecentGoals().map(goal => (
                <div key={goal._id} className="goal-preview-card">
                  <div className="goal-preview-header">
                    <h4>{goal.title}</h4>
                    <span className={`status-badge ${goal.status}`}>
                      {goal.status}
                    </span>
                  </div>
                  <div className="goal-preview-progress">
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
              ))}
            </div>
          </div>
        )}

        {/* Overdue Goals Alert */}
        {!loading && getOverdueGoals().length > 0 && (
          <div className="overdue-alert">
            <div className="alert-header">
              <h3>⚠️ Overdue Goals</h3>
              <span className="alert-count">{getOverdueGoals().length}</span>
            </div>
            <div className="overdue-goals">
              {getOverdueGoals().slice(0, 3).map(goal => (
                <div key={goal._id} className="overdue-goal">
                  <span className="goal-title">{goal.title}</span>
                  <span className="due-date">
                    Due: {new Date(goal.targetDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/goals" className="alert-action">View All Goals</Link>
          </div>
        )}

        {/* Check-in Overview */}
        {!loading && (upcomingCheckins.length > 0 || overdueCheckins.length > 0) && (
          <div className="checkin-overview">
            <div className="section-header">
              <h3>📅 Check-ins</h3>
              <Link to="/checkin" className="view-all-link">View All</Link>
            </div>
            
            <div className="checkin-stats">
              <div className="checkin-stat">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <div className="stat-value">{upcomingCheckins.length}</div>
                  <div className="stat-label">Upcoming</div>
                </div>
              </div>
              <div className="checkin-stat">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <div className="stat-value">{overdueCheckins.length}</div>
                  <div className="stat-label">Overdue</div>
                </div>
              </div>
              <div className="checkin-stat">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">{checkinStats.completionRate || 0}%</div>
                  <div className="stat-label">Completion Rate</div>
                </div>
              </div>
            </div>

            {overdueCheckins.length > 0 && (
              <div className="overdue-checkins-alert">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <h4>You have {overdueCheckins.length} overdue check-in{overdueCheckins.length !== 1 ? 's' : ''}</h4>
                  <p>Complete or reschedule them to stay on track.</p>
                </div>
                <Link to="/checkin" className="alert-action">View Check-ins</Link>
              </div>
            )}

            {upcomingCheckins.length > 0 && (
              <div className="upcoming-checkins">
                <h4>Upcoming Check-ins</h4>
                <div className="upcoming-list">
                  {upcomingCheckins.slice(0, 3).map(checkin => (
                    <div key={checkin._id} className="upcoming-checkin">
                      <div className="checkin-info">
                        <div className="checkin-title">{checkin.title}</div>
                        <div className="checkin-date">
                          {new Date(checkin.scheduledDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="checkin-frequency">
                        {checkin.frequency}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="user-details">
          <h3>Account Information</h3>
          <div className="user-details-grid">
            <div className="detail-item">
              <strong>Name:</strong> {user?.firstName} {user?.lastName}
            </div>
            <div className="detail-item">
              <strong>Email:</strong> {user?.email}
            </div>
            <div className="detail-item">
              <strong>Email Verified:</strong> 
              <span className={user?.isEmailVerified ? 'verified' : 'not-verified'}>
                {user?.isEmailVerified ? ' ✅ Yes' : ' ❌ No'}
              </span>
            </div>
            <div className="detail-item">
              <strong>Member Since:</strong> {new Date(user?.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
