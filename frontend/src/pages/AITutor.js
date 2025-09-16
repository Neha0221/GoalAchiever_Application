import React, { useState, useEffect, useRef } from 'react';
import { useAITutor } from '../context/AITutorContext';
import './AITutor.css';

const AITutor = () => {
  const {
    currentSession,
    messages,
    isTyping,
    loading,
    error,
    isVideoEnabled,
    isAudioEnabled,
    practiceProblems,
    recommendations,
    sendMessage,
    quickResponse,
    createSession,
    addQuickResponseToChat,
    toggleVideo,
    toggleAudio,
    clearError,
    loadRecommendations
  } = useAITutor();

  const [inputMessage, setInputMessage] = useState('');
  const [showPractice, setShowPractice] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load recommendations on mount (disabled to reduce API calls)
  // useEffect(() => {
  //   loadRecommendations();
  // }, [loadRecommendations]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const message = inputMessage.trim();
    setInputMessage('');

    try {
      await sendMessage(message, currentSession?._id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleQuickQuestion = async (question) => {
    try {
      const response = await quickResponse(question);
      console.log('Quick response:', response);
      
      // Add the question and response to the chat messages directly
      if (response && response.response) {
        // Create a temporary session if none exists
        let sessionId = currentSession?._id;
        if (!sessionId) {
          // Create a new session for the quick response
          const newSession = await createSession({ title: 'Quick Questions' });
          sessionId = newSession._id;
        }
        
        // Add user question and AI response to messages
        await addQuickResponseToChat(sessionId, question, response.response);
      }
    } catch (error) {
      console.error('Error getting quick response:', error);
      // Error is already handled by the context and will be displayed in the error banner
    }
  };

  const formatMessage = (message) => {
    if (typeof message === 'string') return message;
    if (message && typeof message === 'object') {
      return message.content || message.message || JSON.stringify(message);
    }
    return 'Unable to display message';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="ai-tutor-container">
      {/* Header */}
      <div className="ai-tutor-header">
        <div className="avatar-section">
          <div className="avatar-display">
            <div className="avatar-placeholder">
              <div className="avatar-face">
                <div className="avatar-eyes">
                  <div className="eye left"></div>
                  <div className="eye right"></div>
                </div>
                <div className="avatar-mouth"></div>
              </div>
            </div>
            <div className="avatar-status">
              <div className={`status-indicator ${isTyping ? 'typing' : 'idle'}`}></div>
              <span>{isTyping ? 'Thinking...' : 'Ready'}</span>
            </div>
          </div>
        </div>
        
        <div className="controls-section">
          <button 
            className={`control-btn ${isVideoEnabled ? 'active' : ''}`}
            onClick={toggleVideo}
            title="Toggle Video"
          >
            📹
          </button>
          <button 
            className={`control-btn ${isAudioEnabled ? 'active' : ''}`}
            onClick={toggleAudio}
            title="Toggle Audio"
          >
            🔊
          </button>
          <button 
            className="control-btn"
            onClick={() => setShowPractice(!showPractice)}
            title="Practice Problems"
          >
            📚
          </button>
          <button 
            className="control-btn"
            onClick={loadRecommendations}
            title="Load Recommendations"
          >
            💡
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ai-tutor-main">
        {/* Chat Section */}
        <div className="chat-section">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <h3>👋 Welcome to your AI Tutor!</h3>
                <p>I'm here to help you achieve your goals. Ask me anything or try one of these quick questions:</p>
                <div className="quick-questions">
                  <button 
                    className="quick-btn"
                    onClick={() => handleQuickQuestion("How can I stay motivated to achieve my goals?")}
                    disabled={loading}
                  >
                    How to stay motivated?
                  </button>
                  <button 
                    className="quick-btn"
                    onClick={() => handleQuickQuestion("What are some effective goal-setting techniques?")}
                    disabled={loading}
                  >
                    Goal-setting tips
                  </button>
                  <button 
                    className="quick-btn"
                    onClick={() => handleQuickQuestion("How do I break down a big goal into smaller tasks?")}
                    disabled={loading}
                  >
                    Break down goals
                  </button>
                </div>
                
                {/* Fallback content when AI is unavailable */}
                {error && (error.includes('unavailable') || error.includes('busy')) && (
                  <div className="fallback-content">
                    <h4>💡 While the AI is busy, here are some helpful resources:</h4>
                    <div className="fallback-tips">
                      <div className="tip-card">
                        <h5>🎯 SMART Goals</h5>
                        <p>Make your goals Specific, Measurable, Achievable, Relevant, and Time-bound.</p>
                      </div>
                      <div className="tip-card">
                        <h5>📝 Break It Down</h5>
                        <p>Divide large goals into smaller, manageable tasks with clear deadlines.</p>
                      </div>
                      <div className="tip-card">
                        <h5>📊 Track Progress</h5>
                        <p>Regular check-ins help you stay on track and celebrate small wins.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-content">
                    <div className="message-text">
                      {formatMessage(message)}
                    </div>
                    <div className="message-time">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isTyping && (
              <div className="message assistant typing">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <form onSubmit={handleSendMessage} className="message-input-form">
            <div className="input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about your goals..."
                className="message-input"
                disabled={isTyping}
              />
              <button 
                type="submit" 
                className="send-button"
                disabled={!inputMessage.trim() || isTyping}
              >
                {isTyping ? '⏳' : '➤'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Practice Problems */}
          {showPractice && (
            <div className="sidebar-section">
              <h4>Practice Problems</h4>
              <div className="practice-problems">
                {practiceProblems.length > 0 ? (
                  practiceProblems.map((problem, index) => (
                    <div key={index} className="problem-card">
                      <h5>Problem {problem.id}</h5>
                      <p>{problem.question}</p>
                      <div className="problem-difficulty">
                        Difficulty: {problem.difficulty}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No practice problems available. Start a conversation to generate some!</p>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="sidebar-section">
            <h4>Learning Recommendations</h4>
            <div className="recommendations">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    {rec}
                  </div>
                ))
              ) : (
                <p>Loading recommendations...</p>
              )}
            </div>
          </div>

          {/* Session Info */}
          <div className="sidebar-section">
            <h4>Session Info</h4>
            <div className="session-info">
              <p>Messages: {messages.length}</p>
              <p>Status: {currentSession ? 'Active' : 'No session'}</p>
              <p>Model: gpt-oss-20b:free</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={`error-banner ${
          error.includes('Rate limit') || error.includes('busy') ? 'rate-limit-error' : 
          error.includes('unavailable') ? 'service-unavailable-error' :
          error.includes('timeout') ? 'timeout-error' :
          error.includes('Network') ? 'network-error' : 'general-error'
        }`}>
          <div className="error-content">
            <div className="error-icon">
              {error.includes('Rate limit') || error.includes('busy') ? '⏰' :
               error.includes('unavailable') ? '🔧' :
               error.includes('timeout') ? '⏱️' :
               error.includes('Network') ? '🌐' : '⚠️'}
            </div>
            <div className="error-message">
              <span>{typeof error === 'string' ? error : error.message || JSON.stringify(error)}</span>
              {(error.includes('Rate limit') || error.includes('busy')) && (
                <div className="error-suggestion">
                  💡 Try again in a few minutes, or use the practice problems and recommendations below.
                </div>
              )}
              {error.includes('unavailable') && (
                <div className="error-suggestion">
                  💡 The AI service is being updated. You can still explore your goals and check-ins.
                </div>
              )}
            </div>
          </div>
          <button onClick={clearError} className="close-error" title="Dismiss error">×</button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default AITutor;
