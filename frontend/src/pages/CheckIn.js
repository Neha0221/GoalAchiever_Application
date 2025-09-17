import React, { useState, useEffect } from 'react';
import { useCheckIns } from '../context/CheckInContext';
import { useGoals } from '../context/GoalContext';
import CheckInList from '../components/checkin/CheckInList';
import './CheckIn.css';

const CheckIn = () => {
  const { 
    upcomingCheckins, 
    overdueCheckins, 
    fetchUpcomingCheckins,
    fetchOverdueCheckins
  } = useCheckIns();
  
  const { goals } = useGoals();

  useEffect(() => {
    fetchUpcomingCheckins(5);
    fetchOverdueCheckins();
  }, [fetchUpcomingCheckins, fetchOverdueCheckins]);

  const getUpcomingCount = () => {
    return upcomingCheckins.length;
  };

  const getOverdueCount = () => {
    return overdueCheckins.length;
  };

  const getActiveGoalsCount = () => {
    return goals.filter(goal => goal.status === 'active').length;
  };

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
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{getActiveGoalsCount()}</div>
              <div className="stat-label">Active Goals</div>
            </div>
          </div>
        </div>
      </div>

      <div className="checkin-content">
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
      </div>
    </div>
  );
};

export default CheckIn;
