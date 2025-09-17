import React, { useState, useEffect } from 'react';
import './GoalForm.css';

const GoalForm = ({ goal, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'learning',
    complexity: 'intermediate',
    priority: 'medium',
    targetDate: '',
    suggestedTimeline: '3months',
    tags: [],
    isPublic: false
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { value: 'learning', label: 'Learning' },
    { value: 'career', label: 'Career' },
    { value: 'health', label: 'Health' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'personal', label: 'Personal' },
    { value: 'financial', label: 'Financial' },
    { value: 'creative', label: 'Creative' },
    { value: 'social', label: 'Social' }
  ];

  const complexities = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const timelines = [
    { value: '1week', label: '1 Week' },
    { value: '2weeks', label: '2 Weeks' },
    { value: '1month', label: '1 Month' },
    { value: '2months', label: '2 Months' },
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
    { value: 'custom', label: 'Custom' }
  ];

  useEffect(() => {
    if (goal && isEditing) {
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || 'learning',
        complexity: goal.complexity || 'intermediate',
        priority: goal.priority || 'medium',
        targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
        suggestedTimeline: goal.suggestedTimeline || '3months',
        tags: Array.isArray(goal.tags) ? goal.tags : [],
        isPublic: goal.isPublic || false
      });
    }
  }, [goal, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTagAdd = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
      if (!currentTags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...currentTags, newTag]
        }));
      }
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove) => {
    const currentTags = Array.isArray(formData.tags) ? formData.tags : [];
    setFormData(prev => ({
      ...prev,
      tags: currentTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.targetDate) {
      newErrors.targetDate = 'Target date is required';
    } else if (new Date(formData.targetDate) <= new Date()) {
      newErrors.targetDate = 'Target date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        targetDate: new Date(formData.targetDate).toISOString()
      };

      console.log('GoalForm - Submitting data:', submitData);
      const result = await onSubmit(submitData);
      console.log('GoalForm - Submit successful, result:', result);
    } catch (error) {
      console.error('GoalForm - Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimelineDescription = (timeline) => {
    const descriptions = {
      '1week': 'Perfect for quick tasks and small projects',
      '2weeks': 'Good for short-term goals and skill building',
      '1month': 'Ideal for learning new concepts or habits',
      '2months': 'Great for medium-term projects and skill development',
      '3months': 'Perfect for comprehensive learning or project completion',
      '6months': 'Excellent for major skill development or career goals',
      '1year': 'Ideal for long-term transformation and mastery',
      'custom': 'Set your own timeline based on your needs'
    };
    return descriptions[timeline] || '';
  };

  return (
    <div className="goal-form-overlay">
      <div className="goal-form-container">
        <div className="goal-form-header">
          <h2>{isEditing ? 'Edit Goal' : 'Create New Goal'}</h2>
          <button 
            className="close-btn"
            onClick={onCancel}
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="goal-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Goal Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={errors.title ? 'error' : ''}
                placeholder="What do you want to achieve?"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={errors.description ? 'error' : ''}
                placeholder="Describe your goal in detail..."
                rows="4"
              />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="complexity">Complexity</label>
                <select
                  id="complexity"
                  name="complexity"
                  value={formData.complexity}
                  onChange={handleChange}
                >
                  {complexities.map(comp => (
                    <option key={comp.value} value={comp.value}>
                      {comp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Timeline & Priority</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  {priorities.map(pri => (
                    <option key={pri.value} value={pri.value}>
                      {pri.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="suggestedTimeline">Suggested Timeline</label>
                <select
                  id="suggestedTimeline"
                  name="suggestedTimeline"
                  value={formData.suggestedTimeline}
                  onChange={handleChange}
                >
                  {timelines.map(timeline => (
                    <option key={timeline.value} value={timeline.value}>
                      {timeline.label}
                    </option>
                  ))}
                </select>
                <small className="timeline-description">
                  {getTimelineDescription(formData.suggestedTimeline)}
                </small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="targetDate">Target Date *</label>
              <input
                type="date"
                id="targetDate"
                name="targetDate"
                value={formData.targetDate}
                onChange={handleChange}
                className={errors.targetDate ? 'error' : ''}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.targetDate && <span className="error-message">{errors.targetDate}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Tags & Settings</h3>
            
            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <div className="tags-input-container">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagAdd}
                  placeholder="Add tags to categorize your goal..."
                  className="tag-input"
                />
                <small className="tag-hint">Press Enter to add tags</small>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="tags-display">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                />
                <span className="checkbox-text">Make this goal public</span>
              </label>
              <small className="checkbox-description">
                Public goals can be seen by other users and may inspire others
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Goal' : 'Create Goal')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalForm;
