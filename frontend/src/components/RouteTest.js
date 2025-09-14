import React from 'react';
import { Link } from 'react-router-dom';
import './RouteTest.css';

const RouteTest = () => {
  return (
    <div className="route-test">
      <h1>Route Test Page</h1>
      <p>This page helps you test all authentication routes.</p>
      
      <div className="route-links">
        <h2>Public Routes:</h2>
        <div className="route-grid">
          <Link to="/login" className="route-link">
            <h3>Login</h3>
            <p>User login page</p>
          </Link>
          
          <Link to="/register" className="route-link">
            <h3>Register</h3>
            <p>User registration page</p>
          </Link>
          
          <Link to="/forgot-password" className="route-link">
            <h3>Forgot Password</h3>
            <p>Password reset request</p>
          </Link>
          
          <Link to="/reset-password?token=test" className="route-link">
            <h3>Reset Password</h3>
            <p>Password reset with token</p>
          </Link>
          
          <Link to="/verify-email" className="route-link">
            <h3>Verify Email</h3>
            <p>Email verification page</p>
          </Link>
        </div>
        
        <h2>Protected Routes:</h2>
        <div className="route-grid">
          <Link to="/dashboard" className="route-link">
            <h3>Dashboard</h3>
            <p>Protected user dashboard</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RouteTest;
