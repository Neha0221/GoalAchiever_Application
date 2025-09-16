import React, { useState, useEffect } from 'react';
import { useCheckIns } from '../../context/CheckInContext';
import { useGoals } from '../../context/GoalContext';
import './CheckInCalendar.css';

const CheckInCalendar = () => {
  const { calendarData, fetchCalendarData } = useCheckIns();
  const { goals } = useGoals();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month'); // month, week, day
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, view]);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const startDate = getStartDate();
      const endDate = getEndDate();
      await fetchCalendarData(startDate, endDate);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStartDate = () => {
    const date = new Date(currentDate);
    switch (view) {
      case 'month':
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      case 'week':
        const dayOfWeek = date.getDay();
        date.setDate(date.getDate() - dayOfWeek);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      case 'day':
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
      default:
        return date.toISOString();
    }
  };

  const getEndDate = () => {
    const date = new Date(currentDate);
    switch (view) {
      case 'month':
        date.setMonth(date.getMonth() + 1, 0);
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
      case 'week':
        const dayOfWeek = date.getDay();
        date.setDate(date.getDate() + (6 - dayOfWeek));
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
      case 'day':
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
      default:
        return date.toISOString();
    }
  };

  const getCheckinsForDate = (date) => {
    if (!Array.isArray(calendarData)) return [];
    return calendarData.filter(checkin => {
      const checkinDate = new Date(checkin.start);
      return checkinDate.toDateString() === date.toDateString();
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'scheduled':
        return '#3b82f6';
      case 'pending':
        return '#f59e0b';
      case 'missed':
        return '#ef4444';
      case 'cancelled':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case 'daily':
        return '📅';
      case 'weekly':
        return '📆';
      case 'bi-weekly':
        return '🗓️';
      case 'monthly':
        return '📋';
      case 'custom':
        return '⚙️';
      default:
        return '📅';
    }
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + direction);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div className="month-view">
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const checkins = getCheckinsForDate(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
            
            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="day-number">{day.getDate()}</div>
                <div className="day-checkins">
                  {checkins.slice(0, 3).map((checkin, idx) => (
                    <div
                      key={idx}
                      className="checkin-indicator"
                      style={{ backgroundColor: getStatusColor(checkin.status) }}
                      title={`${checkin.title} - ${checkin.status}`}
                    />
                  ))}
                  {checkins.length > 3 && (
                    <div className="more-indicator">
                      +{checkins.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return (
      <div className="week-view">
        <div className="week-grid">
          {days.map((day, index) => {
            const checkins = getCheckinsForDate(day);
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div key={index} className={`week-day ${isToday ? 'today' : ''}`}>
                <div className="week-day-header">
                  <div className="week-day-name">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="week-day-number">{day.getDate()}</div>
                </div>
                <div className="week-day-checkins">
                  {checkins.map((checkin, idx) => (
                    <div
                      key={idx}
                      className="week-checkin-item"
                      style={{ borderLeftColor: getStatusColor(checkin.status) }}
                    >
                      <div className="checkin-time">
                        {formatTime(checkin.start)}
                      </div>
                      <div className="checkin-title">
                        {checkin.title}
                      </div>
                      <div className="checkin-frequency">
                        {getFrequencyIcon(checkin.frequency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const checkins = getCheckinsForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    return (
      <div className="day-view">
        <div className="day-header">
          <div className="day-date">
            {formatDate(currentDate)}
            {isToday && <span className="today-badge">Today</span>}
          </div>
          <div className="day-checkins-count">
            {checkins.length} check-in{checkins.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="day-checkins">
          {checkins.length === 0 ? (
            <div className="no-checkins">
              <div className="no-checkins-icon">📅</div>
              <h3>No check-ins scheduled</h3>
              <p>You have no check-ins scheduled for this day.</p>
            </div>
          ) : (
            checkins.map((checkin, index) => (
              <div
                key={index}
                className="day-checkin-item"
                style={{ borderLeftColor: getStatusColor(checkin.status) }}
              >
                <div className="checkin-time">
                  {formatTime(checkin.start)}
                </div>
                <div className="checkin-details">
                  <div className="checkin-title">{checkin.title}</div>
                  <div className="checkin-meta">
                    <span className="checkin-status" style={{ color: getStatusColor(checkin.status) }}>
                      {checkin.status}
                    </span>
                    <span className="checkin-frequency">
                      {getFrequencyIcon(checkin.frequency)} {checkin.frequency}
                    </span>
                  </div>
                  {checkin.goal && (
                    <div className="checkin-goal">
                      Goal: {goals.find(g => g._id === checkin.goal._id)?.title || 'Unknown Goal'}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderSelectedDateDetails = () => {
    if (!selectedDate) return null;
    
    const checkins = getCheckinsForDate(selectedDate);
    
    return (
      <div className="selected-date-details">
        <div className="details-header">
          <h3>{formatDate(selectedDate)}</h3>
          <button 
            className="close-details"
            onClick={() => setSelectedDate(null)}
          >
            ×
          </button>
        </div>
        <div className="details-content">
          {checkins.length === 0 ? (
            <p>No check-ins scheduled for this date.</p>
          ) : (
            checkins.map((checkin, index) => (
              <div key={index} className="detail-checkin-item">
                <div className="detail-checkin-header">
                  <div className="detail-checkin-title">{checkin.title}</div>
                  <div 
                    className="detail-checkin-status"
                    style={{ color: getStatusColor(checkin.status) }}
                  >
                    {checkin.status}
                  </div>
                </div>
                <div className="detail-checkin-meta">
                  <span>{formatTime(checkin.start)}</span>
                  <span>{getFrequencyIcon(checkin.frequency)} {checkin.frequency}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="checkin-calendar">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button 
            className="nav-btn"
            onClick={() => navigateDate(-1)}
          >
            ←
          </button>
          <button 
            className="today-btn"
            onClick={goToToday}
          >
            Today
          </button>
          <button 
            className="nav-btn"
            onClick={() => navigateDate(1)}
          >
            →
          </button>
        </div>
        
        <div className="calendar-title">
          {view === 'month' && formatDate(currentDate).split(' ').slice(0, 2).join(' ')}
          {view === 'week' && `Week of ${formatDate(currentDate)}`}
          {view === 'day' && formatDate(currentDate)}
        </div>
        
        <div className="calendar-view-controls">
          <button 
            className={`view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button 
            className={`view-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button 
            className={`view-btn ${view === 'day' ? 'active' : ''}`}
            onClick={() => setView('day')}
          >
            Day
          </button>
        </div>
      </div>

      {loading ? (
        <div className="calendar-loading">
          <div className="spinner"></div>
          <p>Loading calendar...</p>
        </div>
      ) : (
        <div className="calendar-content">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>
      )}

      {renderSelectedDateDetails()}
    </div>
  );
};

export default CheckInCalendar;
