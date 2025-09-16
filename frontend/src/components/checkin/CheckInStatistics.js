import React, { useState, useEffect } from 'react';
import { useCheckIns } from '../../context/CheckInContext';
import './CheckInStatistics.css';

const CheckInStatistics = ({ timeRange = 'month' }) => {
  const { statistics, fetchStatistics } = useCheckIns();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      try {
        await fetchStatistics(timeRange);
      } catch (error) {
        console.error('Error loading statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [timeRange, fetchStatistics]);

  const getCompletionRateColor = (rate) => {
    if (rate >= 80) return '#10b981';
    if (rate >= 60) return '#f59e0b';
    if (rate >= 40) return '#3b82f6';
    return '#ef4444';
  };

  const getRatingColor = (rating) => {
    if (rating >= 8) return '#10b981';
    if (rating >= 6) return '#f59e0b';
    if (rating >= 4) return '#3b82f6';
    return '#ef4444';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#10b981';
    if (progress >= 60) return '#f59e0b';
    if (progress >= 40) return '#3b82f6';
    return '#ef4444';
  };

  const StatCard = ({ title, value, subtitle, color, icon, trend }) => (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        <div className="stat-trend">
          {trend && (
            <span className={`trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral'}`}>
              {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      <div className="stat-content">
        <div className="stat-value" style={{ color }}>
          {value}
        </div>
        <div className="stat-title">{title}</div>
        {subtitle && <div className="stat-subtitle">{subtitle}</div>}
      </div>
    </div>
  );

  const ProgressBar = ({ value, max = 100, color, label }) => (
    <div className="progress-bar-container">
      <div className="progress-bar-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">{value}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${Math.min((value / max) * 100, 100)}%`,
            backgroundColor: color 
          }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="statistics-loading">
        <div className="spinner"></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="checkin-statistics">
      <div className="statistics-header">
        <h2>Check-in Statistics</h2>
        <p>Overview of your check-in performance for {timeRange}</p>
      </div>

      <div className="statistics-grid">
        <StatCard
          title="Total Check-ins"
          value={statistics.total || 0}
          subtitle="All time"
          color="#3b82f6"
          icon="📊"
        />
        
        <StatCard
          title="Completed"
          value={statistics.completed || 0}
          subtitle={`${statistics.completionRate || 0}% completion rate`}
          color="#10b981"
          icon="✅"
        />
        
        <StatCard
          title="Missed"
          value={statistics.missed || 0}
          subtitle="Need attention"
          color="#ef4444"
          icon="❌"
        />
        
        <StatCard
          title="Pending"
          value={statistics.pending || 0}
          subtitle="Upcoming"
          color="#f59e0b"
          icon="⏳"
        />
      </div>

      <div className="statistics-details">
        <div className="details-section">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">📈</span>
                <span className="metric-title">Completion Rate</span>
              </div>
              <ProgressBar
                value={statistics.completionRate || 0}
                color={getCompletionRateColor(statistics.completionRate || 0)}
                label="Completion Rate"
              />
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">⭐</span>
                <span className="metric-title">Average Rating</span>
              </div>
              <div className="rating-display">
                <div className="rating-value" style={{ color: getRatingColor(statistics.averageRating || 0) }}>
                  {(statistics.averageRating || 0).toFixed(1)}
                </div>
                <div className="rating-scale">/ 10</div>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-icon">🎯</span>
                <span className="metric-title">Average Progress</span>
              </div>
              <ProgressBar
                value={statistics.averageProgress || 0}
                color={getProgressColor(statistics.averageProgress || 0)}
                label="Average Progress"
              />
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Insights & Recommendations</h3>
          <div className="insights">
            {statistics.completionRate >= 80 ? (
              <div className="insight positive">
                <div className="insight-icon">🎉</div>
                <div className="insight-content">
                  <h4>Excellent Consistency!</h4>
                  <p>You're maintaining a great completion rate. Keep up the excellent work!</p>
                </div>
              </div>
            ) : statistics.completionRate >= 60 ? (
              <div className="insight neutral">
                <div className="insight-icon">👍</div>
                <div className="insight-content">
                  <h4>Good Progress</h4>
                  <p>You're doing well with your check-ins. Consider setting more reminders to improve consistency.</p>
                </div>
              </div>
            ) : (
              <div className="insight negative">
                <div className="insight-icon">💪</div>
                <div className="insight-content">
                  <h4>Room for Improvement</h4>
                  <p>Try setting more frequent reminders or adjusting your check-in schedule to better fit your routine.</p>
                </div>
              </div>
            )}

            {statistics.averageRating >= 8 ? (
              <div className="insight positive">
                <div className="insight-icon">🌟</div>
                <div className="insight-content">
                  <h4>High Satisfaction</h4>
                  <p>Your high ratings show you're making meaningful progress. Continue with your current approach!</p>
                </div>
              </div>
            ) : statistics.averageRating >= 6 ? (
              <div className="insight neutral">
                <div className="insight-icon">📝</div>
                <div className="insight-content">
                  <h4>Steady Progress</h4>
                  <p>Your ratings indicate steady progress. Consider breaking down larger goals into smaller milestones.</p>
                </div>
              </div>
            ) : (
              <div className="insight negative">
                <div className="insight-icon">🔄</div>
                <div className="insight-content">
                  <h4>Time to Adjust</h4>
                  <p>Consider reviewing your goals and strategies. You might need to adjust your approach or timeline.</p>
                </div>
              </div>
            )}

            {statistics.missed > 0 && (
              <div className="insight warning">
                <div className="insight-icon">⚠️</div>
                <div className="insight-content">
                  <h4>Missed Check-ins</h4>
                  <p>You have {statistics.missed} missed check-in{statistics.missed !== 1 ? 's' : ''}. Consider rescheduling or completing them to stay on track.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInStatistics;
