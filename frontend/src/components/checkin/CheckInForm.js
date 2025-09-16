import React, { useState, useEffect } from 'react';
import { useCheckIns } from '../../context/CheckInContext';
import { useGoals } from '../../context/GoalContext';
import { checkinService } from '../../services/checkinService';
import './CheckInForm.css';

const CheckInForm = ({ 
  checkin = null, 
  completingCheckin = null, 
  reschedulingCheckin = null, 
  onClose, 
  onSubmit 
}) => {
  const { createCheckin, updateCheckin, completeCheckin, rescheduleCheckin } = useCheckIns();
  const { goals } = useGoals();
  
  const [formData, setFormData] = useState({
    goal: '',
    title: '',
    description: '',
    type: 'goal',
    frequency: 'weekly',
    scheduledDate: '',
    customFrequency: {
      days: 7,
      hours: 0
    },
    reminderSettings: {
      enabled: true,
      advanceTime: 60,
      methods: ['email', 'in-app']
    },
    isRecurring: true,
    recurrenceEndDate: ''
  });

  const [assessmentData, setAssessmentData] = useState({
    overallProgress: '',
    mood: '',
    energy: '',
    motivation: '',
    challenges: [''],
    achievements: [''],
    notes: '',
    rating: '',
    responses: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const isEditing = !!checkin;
  const isCompleting = !!completingCheckin;
  const isRescheduling = !!reschedulingCheckin;
  const currentCheckin = checkin || completingCheckin || reschedulingCheckin;


  useEffect(() => {
    if (currentCheckin) {
      if (isCompleting) {
        setActiveTab('assessment');
      } else if (isRescheduling) {
        setActiveTab('reschedule');
      } else {
        // Editing existing check-in
        setFormData({
          goal: currentCheckin.goal?._id || currentCheckin.goal || '',
          title: currentCheckin.title || '',
          description: currentCheckin.description || '',
          type: currentCheckin.type || 'goal',
          frequency: currentCheckin.frequency || 'weekly',
          scheduledDate: currentCheckin.scheduledDate ? 
            new Date(currentCheckin.scheduledDate).toISOString().slice(0, 16) : '',
          customFrequency: currentCheckin.customFrequency || { days: 7, hours: 0 },
          reminderSettings: currentCheckin.reminderSettings || {
            enabled: true,
            advanceTime: 60,
            methods: ['email', 'in-app']
          },
          isRecurring: currentCheckin.isRecurring || true,
          recurrenceEndDate: currentCheckin.recurrenceEndDate ? 
            new Date(currentCheckin.recurrenceEndDate).toISOString().slice(0, 16) : ''
        });
      }
    } else {
      // Creating new check-in - set default scheduled date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        scheduledDate: tomorrow.toISOString().slice(0, 16)
      }));
    }
  }, [currentCheckin, isCompleting, isRescheduling]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAssessmentChange = (e) => {
    const { name, value } = e.target;
    setAssessmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (field, index, value) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setAssessmentData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleReminderMethodChange = (method, checked) => {
    setFormData(prev => ({
      ...prev,
      reminderSettings: {
        ...prev.reminderSettings,
        methods: checked 
          ? [...prev.reminderSettings.methods, method]
          : prev.reminderSettings.methods.filter(m => m !== method)
      }
    }));
  };

  const validateForm = () => {
    const validation = checkinService.validateCheckinData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }
    return true;
  };

  const validateAssessment = () => {
    const validation = checkinService.validateAssessmentData(assessmentData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isCompleting) {
        if (!validateAssessment()) {
          setLoading(false);
          return;
        }
        
        const processedAssessment = {
          ...assessmentData,
          overallProgress: assessmentData.overallProgress ? parseInt(assessmentData.overallProgress) : undefined,
          rating: assessmentData.rating ? parseInt(assessmentData.rating) : undefined,
          challenges: assessmentData.challenges.filter(c => c.trim() !== ''),
          achievements: assessmentData.achievements.filter(a => a.trim() !== '')
        };
        
        await completeCheckin(currentCheckin._id, processedAssessment);
      } else if (isRescheduling) {
        await rescheduleCheckin(currentCheckin._id, formData.scheduledDate);
      } else {
        if (!validateForm()) {
          setLoading(false);
          return;
        }
        
        const processedData = {
          ...formData,
          scheduledDate: new Date(formData.scheduledDate).toISOString(),
          recurrenceEndDate: formData.recurrenceEndDate ? 
            new Date(formData.recurrenceEndDate).toISOString() : undefined
        };
        
        if (isEditing) {
          await updateCheckin(currentCheckin._id, processedData);
        } else {
          await createCheckin(processedData);
        }
      }
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error.message || 'An error occurred while saving' });
    } finally {
      setLoading(false);
    }
  };

  const getFormTitle = () => {
    if (isCompleting) return 'Complete Check-in';
    if (isRescheduling) return 'Reschedule Check-in';
    if (isEditing) return 'Edit Check-in';
    return 'Create Check-in';
  };

  const getSubmitButtonText = () => {
    if (isCompleting) return 'Complete Check-in';
    if (isRescheduling) return 'Reschedule';
    if (isEditing) return 'Update Check-in';
    return 'Create Check-in';
  };

  return (
    <div className="checkin-form-overlay">
      <div className="checkin-form-modal">

        <div className="checkin-form-header">
          <h2>{getFormTitle()}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {!isCompleting && !isRescheduling && (
          <div className="form-tabs">
            <button 
              className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              Basic Info
            </button>
            <button 
              className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              Schedule
            </button>
            <button 
              className={`tab ${activeTab === 'reminders' ? 'active' : ''}`}
              onClick={() => setActiveTab('reminders')}
            >
              Reminders
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="checkin-form">
          {isCompleting ? (
            <div className="assessment-form">
              <div className="form-group">
                <label htmlFor="overallProgress">Overall Progress (%)</label>
                <input
                  type="number"
                  id="overallProgress"
                  name="overallProgress"
                  value={assessmentData.overallProgress}
                  onChange={handleAssessmentChange}
                  min="0"
                  max="100"
                  placeholder="Enter progress percentage"
                />
                {errors.overallProgress && <span className="error">{errors.overallProgress}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="mood">Mood</label>
                <select
                  id="mood"
                  name="mood"
                  value={assessmentData.mood}
                  onChange={handleAssessmentChange}
                >
                  <option value="">Select mood</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="neutral">Neutral</option>
                  <option value="poor">Poor</option>
                  <option value="terrible">Terrible</option>
                </select>
                {errors.mood && <span className="error">{errors.mood}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="energy">Energy Level</label>
                <select
                  id="energy"
                  name="energy"
                  value={assessmentData.energy}
                  onChange={handleAssessmentChange}
                >
                  <option value="">Select energy level</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                {errors.energy && <span className="error">{errors.energy}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="motivation">Motivation Level</label>
                <select
                  id="motivation"
                  name="motivation"
                  value={assessmentData.motivation}
                  onChange={handleAssessmentChange}
                >
                  <option value="">Select motivation level</option>
                  <option value="very_high">Very High</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="very_low">Very Low</option>
                </select>
                {errors.motivation && <span className="error">{errors.motivation}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="rating">Overall Rating (1-10)</label>
                <input
                  type="number"
                  id="rating"
                  name="rating"
                  value={assessmentData.rating}
                  onChange={handleAssessmentChange}
                  min="1"
                  max="10"
                  placeholder="Rate your overall experience"
                />
                {errors.rating && <span className="error">{errors.rating}</span>}
              </div>

              <div className="form-group">
                <label>Challenges Faced</label>
                {assessmentData.challenges.map((challenge, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={challenge}
                      onChange={(e) => handleArrayChange('challenges', index, e.target.value)}
                      placeholder="Describe a challenge you faced"
                      maxLength="200"
                    />
                    {assessmentData.challenges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('challenges', index)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('challenges')}
                  className="add-btn"
                >
                  + Add Challenge
                </button>
              </div>

              <div className="form-group">
                <label>Achievements</label>
                {assessmentData.achievements.map((achievement, index) => (
                  <div key={index} className="array-input-group">
                    <input
                      type="text"
                      value={achievement}
                      onChange={(e) => handleArrayChange('achievements', index, e.target.value)}
                      placeholder="Describe an achievement"
                      maxLength="200"
                    />
                    {assessmentData.achievements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('achievements', index)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('achievements')}
                  className="add-btn"
                >
                  + Add Achievement
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={assessmentData.notes}
                  onChange={handleAssessmentChange}
                  placeholder="Any additional thoughts or observations..."
                  maxLength="1000"
                  rows="4"
                />
                {errors.notes && <span className="error">{errors.notes}</span>}
              </div>
            </div>
          ) : isRescheduling ? (
            <div className="reschedule-form">
              <div className="form-group">
                <label htmlFor="scheduledDate">New Scheduled Date</label>
                <input
                  type="datetime-local"
                  id="scheduledDate"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  required
                />
                {errors.scheduledDate && <span className="error">{errors.scheduledDate}</span>}
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'basic' && (
                <div className="basic-info-tab">
                  <div className="form-group">
                    <label htmlFor="goal">Goal *</label>
                    <select
                      id="goal"
                      name="goal"
                      value={formData.goal}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a goal</option>
                      {goals.map(goal => (
                        <option key={goal._id} value={goal._id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                    {errors.goal && <span className="error">{errors.goal}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter check-in title"
                      maxLength="200"
                    />
                    {errors.title && <span className="error">{errors.title}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter check-in description"
                      maxLength="1000"
                      rows="3"
                    />
                    {errors.description && <span className="error">{errors.description}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Type</label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                    >
                      <option value="goal">Goal</option>
                      <option value="journey">Journey</option>
                      <option value="milestone">Milestone</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="schedule-tab">
                  <div className="form-group">
                    <label htmlFor="frequency">Frequency *</label>
                    <select
                      id="frequency"
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                    {errors.frequency && <span className="error">{errors.frequency}</span>}
                  </div>

                  {formData.frequency === 'custom' && (
                    <div className="custom-frequency">
                      <div className="form-group">
                        <label htmlFor="customFrequency.days">Days</label>
                        <input
                          type="number"
                          id="customFrequency.days"
                          name="customFrequency.days"
                          value={formData.customFrequency.days}
                          onChange={handleInputChange}
                          min="1"
                          max="365"
                        />
                        {errors.customDays && <span className="error">{errors.customDays}</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="customFrequency.hours">Hours</label>
                        <input
                          type="number"
                          id="customFrequency.hours"
                          name="customFrequency.hours"
                          value={formData.customFrequency.hours}
                          onChange={handleInputChange}
                          min="0"
                          max="23"
                        />
                        {errors.customHours && <span className="error">{errors.customHours}</span>}
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="scheduledDate">Scheduled Date *</label>
                    <input
                      type="datetime-local"
                      id="scheduledDate"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.scheduledDate && <span className="error">{errors.scheduledDate}</span>}
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                      />
                      Make this a recurring check-in
                    </label>
                  </div>

                  {formData.isRecurring && (
                    <div className="form-group">
                      <label htmlFor="recurrenceEndDate">Recurrence End Date</label>
                      <input
                        type="datetime-local"
                        id="recurrenceEndDate"
                        name="recurrenceEndDate"
                        value={formData.recurrenceEndDate}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reminders' && (
                <div className="reminders-tab">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="reminderSettings.enabled"
                        checked={formData.reminderSettings.enabled}
                        onChange={handleInputChange}
                      />
                      Enable reminders
                    </label>
                  </div>

                  {formData.reminderSettings.enabled && (
                    <>
                      <div className="form-group">
                        <label htmlFor="reminderSettings.advanceTime">Advance Notice (minutes)</label>
                        <input
                          type="number"
                          id="reminderSettings.advanceTime"
                          name="reminderSettings.advanceTime"
                          value={formData.reminderSettings.advanceTime}
                          onChange={handleInputChange}
                          min="5"
                          max="1440"
                        />
                      </div>

                      <div className="form-group">
                        <label>Reminder Methods</label>
                        <div className="checkbox-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.reminderSettings.methods.includes('email')}
                              onChange={(e) => handleReminderMethodChange('email', e.target.checked)}
                            />
                            Email
                          </label>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.reminderSettings.methods.includes('in-app')}
                              onChange={(e) => handleReminderMethodChange('in-app', e.target.checked)}
                            />
                            In-app
                          </label>
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={formData.reminderSettings.methods.includes('push')}
                              onChange={(e) => handleReminderMethodChange('push', e.target.checked)}
                            />
                            Push Notification
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : getSubmitButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInForm;
