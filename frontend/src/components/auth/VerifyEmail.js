import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import './Auth.css';

const VerifyEmail = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    // Check if token is in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      handleVerify(tokenFromUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    setToken(e.target.value);
    // Clear messages when user starts typing
    if (message || error) {
      setMessage('');
      setError('');
    }
  };

  const handleVerify = async (verificationToken = token) => {
    if (!verificationToken) {
      setError('Please enter a verification token');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.verifyEmail(verificationToken);
      setMessage('Email verified successfully! You can now access all features.');
      setIsVerified(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid or expired verification token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email address not found. Please try logging in again.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authService.resendVerification(email);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  if (isVerified) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="success-icon">✅</div>
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified. Redirecting to dashboard...</p>
          </div>
          <div className="auth-footer">
            <p>
              <Link to="/dashboard" className="auth-link">
                Go to Dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify Your Email</h1>
          <p>
            {email 
              ? `We've sent a verification link to ${email}. Please check your inbox and click the link to verify your account.`
              : 'Please enter the verification token from your email to verify your account.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="token">Verification Token</label>
            <input
              type="text"
              id="token"
              name="token"
              value={token}
              onChange={handleChange}
              placeholder="Enter verification token from your email"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !token}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        {email && (
          <div className="resend-section">
            <p>Didn't receive the email?</p>
            <button
              type="button"
              className="resend-button"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        <div className="auth-footer">
          <p>
            <Link to="/login" className="auth-link">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
