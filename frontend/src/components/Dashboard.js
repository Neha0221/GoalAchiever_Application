import React from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome to Goal Achiever!</h2>
          <p>Start setting and achieving your goals today.</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>🎯 My Goals</h3>
            <p>Set and track your personal goals</p>
            <button className="card-button">View Goals</button>
          </div>

          <div className="dashboard-card">
            <h3>📊 Progress</h3>
            <p>Monitor your progress and achievements</p>
            <button className="card-button">View Progress</button>
          </div>

          <div className="dashboard-card">
            <h3>🤖 AI Tutor</h3>
            <p>Get personalized guidance and insights</p>
            <button className="card-button">Start Chat</button>
          </div>

          <div className="dashboard-card">
            <h3>📝 Check-ins</h3>
            <p>Daily check-ins to stay on track</p>
            <button className="card-button">Check In</button>
          </div>
        </div>

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
