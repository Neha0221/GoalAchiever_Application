import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
  };

  // Don't show navigation on auth pages
  if (location.pathname.includes('/login') || 
      location.pathname.includes('/register') || 
      location.pathname.includes('/forgot-password') || 
      location.pathname.includes('/reset-password') || 
      location.pathname.includes('/verify-email')) {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-brand">
          Goal Achiever
        </Link>
        
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <span className="nav-user">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <button onClick={handleLogout} className="nav-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
