import React, { useState } from 'react';
import './ReminderSettings.css';

const ReminderSettings = ({ settings, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    enabled: settings?.enabled || true,
    advanceTime: settings?.advanceTime || 60,
    methods: settings?.methods || ['email', 'in-app']
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'enabled') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'advanceTime') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleMethodChange = (method, checked) => {
    setFormData(prev => ({
      ...prev,
      methods: checked 
        ? [...prev.methods, method]
        : prev.methods.filter(m => m !== method)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.enabled && formData.advanceTime < 5) {
      newErrors.advanceTime = 'Advance time must be at least 5 minutes';
    }
    
    if (formData.enabled && formData.advanceTime > 1440) {
      newErrors.advanceTime = 'Advance time cannot exceed 24 hours (1440 minutes)';
    }
    
    if (formData.enabled && formData.methods.length === 0) {
      newErrors.methods = 'At least one reminder method must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const getAdvanceTimeDisplay = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="reminder-settings">
      <div className="settings-header">
        <h3>Reminder Settings</h3>
        <p>Configure how and when you want to be reminded about your check-ins</p>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="enabled"
              checked={formData.enabled}
              onChange={handleInputChange}
            />
            Enable reminders
          </label>
        </div>

        {formData.enabled && (
          <>
            <div className="form-group">
              <label htmlFor="advanceTime">Advance Notice</label>
              <div className="advance-time-input">
                <input
                  type="number"
                  id="advanceTime"
                  name="advanceTime"
                  value={formData.advanceTime}
                  onChange={handleInputChange}
                  min="5"
                  max="1440"
                  placeholder="60"
                />
                <span className="input-suffix">minutes</span>
              </div>
              <div className="time-display">
                {getAdvanceTimeDisplay(formData.advanceTime)} before check-in
              </div>
              {errors.advanceTime && <span className="error">{errors.advanceTime}</span>}
            </div>

            <div className="form-group">
              <label>Reminder Methods</label>
              <div className="methods-grid">
                <label className="method-option">
                  <input
                    type="checkbox"
                    checked={formData.methods.includes('email')}
                    onChange={(e) => handleMethodChange('email', e.target.checked)}
                  />
                  <div className="method-content">
                    <div className="method-icon">📧</div>
                    <div className="method-info">
                      <div className="method-name">Email</div>
                      <div className="method-description">Send reminder to your email address</div>
                    </div>
                  </div>
                </label>

                <label className="method-option">
                  <input
                    type="checkbox"
                    checked={formData.methods.includes('in-app')}
                    onChange={(e) => handleMethodChange('in-app', e.target.checked)}
                  />
                  <div className="method-content">
                    <div className="method-icon">🔔</div>
                    <div className="method-info">
                      <div className="method-name">In-app Notification</div>
                      <div className="method-description">Show notification within the app</div>
                    </div>
                  </div>
                </label>

                <label className="method-option">
                  <input
                    type="checkbox"
                    checked={formData.methods.includes('push')}
                    onChange={(e) => handleMethodChange('push', e.target.checked)}
                  />
                  <div className="method-content">
                    <div className="method-icon">📱</div>
                    <div className="method-info">
                      <div className="method-name">Push Notification</div>
                      <div className="method-description">Send push notification to your device</div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.methods && <span className="error">{errors.methods}</span>}
            </div>
          </>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="save-btn">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReminderSettings;
