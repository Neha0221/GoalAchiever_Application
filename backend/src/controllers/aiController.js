const OpenRouterService = require('../services/openRouterService');
const ChatSession = require('../models/ChatSession');
const Goal = require('../models/Goal');
const Journey = require('../models/Journey');

class AIController {
  // Main chat endpoint
  static async chat(req, res) {
    try {
      const { message, sessionId } = req.body;
      const userId = req.user.id;

      // Input validation
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Message cannot be empty',
          code: 'EMPTY_MESSAGE'
        });
      }

      if (message.length > 2000) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Message too long (max 2000 characters)',
          code: 'MESSAGE_TOO_LONG'
        });
      }

      // Get or create chat session
      let session;
      try {
        if (sessionId) {
          // Validate sessionId format
          if (!sessionId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
              success: false,
              error: 'VALIDATION_ERROR',
              message: 'Invalid session ID format',
              code: 'INVALID_SESSION_ID'
            });
          }

          session = await ChatSession.findById(sessionId);
          if (!session) {
            return res.status(404).json({
              success: false,
              error: 'NOT_FOUND',
              message: 'Chat session not found',
              code: 'SESSION_NOT_FOUND'
            });
          }

          if (session.user.toString() !== userId.toString()) {
            return res.status(403).json({
              success: false,
              error: 'FORBIDDEN',
              message: 'Access denied to this session',
              code: 'SESSION_ACCESS_DENIED'
            });
          }
        } else {
          // Create new session with error handling
          const context = await AIController.getUserContext(userId);
          session = await ChatSession.createSession(userId, context);
        }
      } catch (sessionError) {
        console.error('Session Error:', sessionError);
        return res.status(500).json({
          success: false,
          error: 'SESSION_ERROR',
          message: 'Failed to access chat session',
          code: 'SESSION_ACCESS_FAILED'
        });
      }

      // Get updated user context with error handling
      let context;
      try {
        context = await AIController.getUserContext(userId);
        context.activeModule = session.context?.activeModule || null;
      } catch (contextError) {
        console.error('Context Error:', contextError);
        // Continue with minimal context if context loading fails
        context = {
          goal: null,
          journey: null,
          userLevel: 'beginner',
          activeModule: null
        };
      }

      // Record start time for response time calculation
      const startTime = Date.now();

      // Generate AI response with comprehensive error handling
      let aiResponse;
      try {
        aiResponse = await OpenRouterService.generateTutorResponse(message, context);
      } catch (aiError) {
        console.error('AI Service Error:', aiError);
        
        // Handle different types of AI errors
        if (aiError.message.includes('Rate limit')) {
          return res.status(429).json({
            success: false,
            error: 'RATE_LIMIT',
            message: 'AI service is busy. Please wait a moment and try again.',
            code: 'AI_RATE_LIMIT',
            retryAfter: 30
          });
        }
        
        if (aiError.message.includes('temporarily unavailable')) {
          return res.status(503).json({
            success: false,
            error: 'SERVICE_UNAVAILABLE',
            message: 'AI service is temporarily unavailable. Please try again later.',
            code: 'AI_SERVICE_DOWN'
          });
        }

        // For other AI errors, provide a fallback response
        aiResponse = {
          content: "I'm having trouble processing your request right now. Please try rephrasing your question or try again in a moment.",
          model: 'fallback',
          usage: { total_tokens: 0 }
        };
      }
      
      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Add messages to session with error handling
      try {
        await session.addMessage('user', message);
        await session.addMessage('assistant', aiResponse.content, {
          model: aiResponse.model,
          tokens: aiResponse.usage?.total_tokens || 0,
          responseTime: responseTime
        });
      } catch (messageError) {
        console.error('Message Save Error:', messageError);
        // Continue even if message saving fails
      }

      res.json({
        success: true,
        response: aiResponse.content,
        sessionId: session._id,
        model: aiResponse.model,
        usage: aiResponse.usage,
        responseTime: responseTime
      });
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Classify error type
      let errorType = 'INTERNAL_ERROR';
      let statusCode = 500;
      let errorCode = 'UNKNOWN_ERROR';
      
      if (error.name === 'ValidationError') {
        errorType = 'VALIDATION_ERROR';
        statusCode = 400;
        errorCode = 'VALIDATION_FAILED';
      } else if (error.name === 'CastError') {
        errorType = 'INVALID_INPUT';
        statusCode = 400;
        errorCode = 'INVALID_ID_FORMAT';
      } else if (error.code === 11000) {
        errorType = 'DUPLICATE_ERROR';
        statusCode = 409;
        errorCode = 'DUPLICATE_ENTRY';
      }

      res.status(statusCode).json({
        success: false,
        error: errorType,
        message: 'Failed to process chat message',
        code: errorCode,
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      });
    }
  }

  // Quick response endpoint (for simple questions)
  static async quickResponse(req, res) {
    try {
      const { message } = req.body;
      const userId = req.user.id;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message cannot be empty'
        });
      }

      const startTime = Date.now();
      const aiResponse = await OpenRouterService.generateQuickResponse(message);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        response: aiResponse.content,
        model: aiResponse.model,
        usage: aiResponse.usage,
        responseTime: responseTime
      });
    } catch (error) {
      console.error('Quick Response Error:', error);
      
      // Handle specific error types
      if (error.code === 'AI_RATE_LIMIT') {
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT',
          message: 'AI service rate limit exceeded. Please wait a moment before trying again.',
          code: 'AI_RATE_LIMIT',
          retryAfter: error.retryAfter || 30
        });
      }
      
      if (error.code === 'AI_SERVICE_DOWN' || error.code === 'AI_SERVICE_UNAVAILABLE') {
        return res.status(503).json({
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: 'AI service is temporarily unavailable. Please try again later.',
          code: 'AI_SERVICE_DOWN'
        });
      }

      if (error.code === 'AI_TIMEOUT') {
        return res.status(408).json({
          success: false,
          error: 'TIMEOUT',
          message: 'AI service request timeout. Please try again.',
          code: 'AI_TIMEOUT'
        });
      }

      // Default error response
      res.status(500).json({
        success: false,
        message: 'Failed to generate quick response',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user's chat sessions
  static async getSessions(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status = 'all' } = req.query;

      const query = { user: userId };
      if (status !== 'all') {
        query.status = status;
      }

      const sessions = await ChatSession.find(query)
        .populate('context.goal', 'title category')
        .populate('context.journey', 'title')
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await ChatSession.countDocuments(query);

      res.json({
        success: true,
        sessions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      console.error('Get Sessions Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat sessions'
      });
    }
  }

  // Get specific session with messages
  static async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      console.log('Getting session:', { sessionId, userId });

      // Validate sessionId format
      if (!sessionId || !sessionId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid session ID format'
        });
      }

      const session = await ChatSession.findOne({
        _id: sessionId,
        user: userId
      }).populate('context.goal', 'title category description')
        .populate('context.journey', 'title description');

      if (!session) {
        console.log('Session not found:', { sessionId, userId });
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      console.log('Session found:', session._id);
      res.json({
        success: true,
        session
      });
    } catch (error) {
      console.error('Get Session Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        sessionId: req.params.sessionId,
        userId: req.user?.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Create new session
  static async createSession(req, res) {
    try {
      const userId = req.user.id;
      const { title, context } = req.body;

      const userContext = await AIController.getUserContext(userId);
      const mergedContext = { ...userContext, ...context };

      const session = await ChatSession.createSession(userId, mergedContext);
      
      if (title) {
        session.title = title;
        await session.save();
      }

      res.json({
        success: true,
        session
      });
    } catch (error) {
      console.error('Create Session Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create chat session'
      });
    }
  }

  // Update session status
  static async updateSessionStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const session = await ChatSession.findOne({
        _id: sessionId,
        user: userId
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      // Update status based on action
      switch (status) {
        case 'pause':
          await session.pause();
          break;
        case 'resume':
          await session.resume();
          break;
        case 'complete':
          await session.complete();
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid status'
          });
      }

      res.json({
        success: true,
        session
      });
    } catch (error) {
      console.error('Update Session Status Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update session status'
      });
    }
  }

  // Delete session
  static async deleteSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      const session = await ChatSession.findOneAndDelete({
        _id: sessionId,
        user: userId
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Chat session not found'
        });
      }

      res.json({
        success: true,
        message: 'Session deleted successfully'
      });
    } catch (error) {
      console.error('Delete Session Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete session'
      });
    }
  }

  // Generate practice problems
  static async generatePracticeProblems(req, res) {
    try {
      const { moduleId, userProgress = 0 } = req.body;
      const userId = req.user.id;

      // For now, create a mock module - later integrate with actual learning modules
      const module = {
        title: 'Goal Achievement Fundamentals',
        relatedGoal: 'Learn effective goal setting techniques'
      };

      const aiResponse = await OpenRouterService.generatePracticeProblems(module, userProgress);
      
      // Try to parse JSON response
      let problems;
      try {
        problems = JSON.parse(aiResponse.content);
      } catch (parseError) {
        // If JSON parsing fails, create a simple structure
        problems = {
          problems: [{
            id: 1,
            question: aiResponse.content,
            difficulty: 'medium',
            hints: ['Think about your current goals', 'Consider what has worked before'],
            solution: 'This is a practice problem to help you learn.'
          }]
        };
      }

      res.json({
        success: true,
        problems: problems.problems || problems,
        model: aiResponse.model
      });
    } catch (error) {
      console.error('Generate Practice Problems Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate practice problems'
      });
    }
  }

  // Get learning recommendations
  static async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const userProgress = await AIController.getUserProgress(userId);
      const goals = await Goal.find({ user: userId, status: 'active' });

      try {
        const aiResponse = await OpenRouterService.recommendNextSteps(userProgress, goals);
        res.json({
          success: true,
          recommendations: aiResponse.content,
          model: aiResponse.model
        });
      } catch (aiError) {
        console.error('AI Recommendations Error:', aiError);
        // Provide fallback recommendations when AI fails
        const fallbackRecommendations = AIController.getFallbackRecommendations(goals);
        res.json({
          success: true,
          recommendations: fallbackRecommendations,
          model: 'fallback',
          note: 'Using fallback recommendations due to AI service unavailability'
        });
      }
    } catch (error) {
      console.error('Get Recommendations Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendations'
      });
    }
  }

  // Helper method to get user context
  static async getUserContext(userId) {
    try {
      // Validate userId
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        console.warn('Invalid userId format:', userId);
        return {
          goal: null,
          journey: null,
          userLevel: 'beginner',
          activeModule: null
        };
      }

      let goal = null;
      let journey = null;

      // Get active goal with error handling
      try {
        goal = await Goal.findOne({ 
          user: userId, 
          status: 'active' 
        }).sort({ createdAt: -1 });
      } catch (goalError) {
        console.error('Error fetching goal:', goalError);
        // Continue without goal
      }
      
      // Get journey if goal exists
      if (goal && goal._id) {
        try {
          journey = await Journey.findOne({ goal: goal._id });
        } catch (journeyError) {
          console.error('Error fetching journey:', journeyError);
          // Continue without journey
        }
      }
      
      return {
        goal,
        journey,
        userLevel: goal?.complexity || 'beginner',
        activeModule: null
      };
    } catch (error) {
      console.error('Get User Context Error:', error);
      return {
        goal: null,
        journey: null,
        userLevel: 'beginner',
        activeModule: null
      };
    }
  }

  // Helper method to get user progress
  static async getUserProgress(userId) {
    try {
      const sessions = await ChatSession.find({ user: userId });
      const totalSessions = sessions.length;
      const totalMessages = sessions.reduce((sum, session) => sum + session.statistics.totalMessages, 0);
      const averageResponseTime = sessions.reduce((sum, session) => sum + session.statistics.averageResponseTime, 0) / totalSessions || 0;

      return {
        totalSessions,
        totalMessages,
        averageResponseTime,
        lastActivity: sessions.length > 0 ? Math.max(...sessions.map(s => s.statistics.lastActivity)) : null
      };
    } catch (error) {
      console.error('Get User Progress Error:', error);
      return {
        totalSessions: 0,
        totalMessages: 0,
        averageResponseTime: 0,
        lastActivity: null
      };
    }
  }

  // Fallback recommendations when AI service is unavailable
  static getFallbackRecommendations(goals) {
    const baseRecommendations = [
      "Set specific, measurable goals with clear deadlines",
      "Break down large goals into smaller, manageable tasks",
      "Track your progress regularly and celebrate small wins",
      "Review and adjust your goals weekly",
      "Find an accountability partner or mentor"
    ];

    if (goals && goals.length > 0) {
      const goalCategories = [...new Set(goals.map(goal => goal.category))];
      const categorySpecificRecommendations = {
        'health': [
          "Start with small, sustainable changes to your routine",
          "Track your daily habits and progress",
          "Find activities you enjoy to stay motivated"
        ],
        'career': [
          "Identify specific skills you want to develop",
          "Set up regular learning sessions",
          "Network with professionals in your field"
        ],
        'education': [
          "Create a study schedule that works for you",
          "Use active learning techniques like practice tests",
          "Join study groups or find a study partner"
        ],
        'personal': [
          "Focus on one personal development area at a time",
          "Practice mindfulness and self-reflection",
          "Set aside dedicated time for personal growth"
        ]
      };

      const specificRecommendations = goalCategories
        .map(category => categorySpecificRecommendations[category] || [])
        .flat()
        .slice(0, 3);

      return [...baseRecommendations, ...specificRecommendations].slice(0, 5);
    }

    return baseRecommendations; 
  }
}

module.exports = AIController;