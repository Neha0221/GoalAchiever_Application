const axios = require('axios');
const MockAIService = require('./mockAIService');
require('dotenv').config();

class OpenRouterService {
  constructor() {
    this.baseURL = 'https://openrouter.ai/api/v1';
    this.lastRequestTime = 0;
    this.minRequestInterval = 2000; // 2 seconds between requests
  }

  // Get API key dynamically
  getApiKey() {
    return process.env.OPENAI_API_KEY;
  }

  // Get model dynamically
  getModel() {
    return process.env.OPENAI_MODEL || 'openai/gpt-oss-20b:free';
  }

  // Check if we should use mock service for testing
  shouldUseMockService() {
    return process.env.USE_MOCK_AI === 'true' || process.env.NODE_ENV === 'test';
  }

  // Ensure minimum interval between requests
  async ensureRequestInterval() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`Waiting ${waitTime}ms before next request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Main method to generate AI responses with retry logic
  async generateResponse(messages, maxTokens = 300, retryCount = 0) {
    try {
      // Ensure minimum interval between requests
      await this.ensureRequestInterval();
      
      const apiKey = this.getApiKey();
      const model = this.getModel();
      
      if (!apiKey) {
        const error = new Error('OPENAI_API_KEY is not set in environment variables');
        error.code = 'MISSING_API_KEY';
        error.statusCode = 500;
        throw error;
      }

      // Enhanced logging
      console.log('=== OpenRouter API Request ===');
      console.log('API Key (first 20 chars):', apiKey.substring(0, 20) + '...');
      console.log('Model:', model);
      console.log('Messages:', messages.length);
      console.log('Max Tokens:', maxTokens);
      console.log('Retry attempt:', retryCount);
      console.log('Request URL:', `${this.baseURL}/chat/completions`);

      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
            'X-Title': 'Goal Achiever AI Tutor'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('=== OpenRouter API Response ===');
      console.log('Status:', response.status);
      console.log('Model used:', response.data.model);
      console.log('Usage:', response.data.usage);

      return {
        content: response.data.choices[0].message.content,
        model: response.data.model || model,
        usage: response.data.usage,
        success: true
      };
    } catch (error) {
      console.error('=== OpenRouter API Error ===');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Code:', error.code);
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Request URL:', `${this.baseURL}/chat/completions`);
      console.error('Model:', this.getModel());
      console.error('API Key (first 20 chars):', this.getApiKey() ? this.getApiKey().substring(0, 20) + '...' : 'Not set');
      console.error('Retry Count:', retryCount);
      
      // Handle rate limiting with retry logic
      if (error.response?.status === 429 && retryCount < 3) {
        const retryAfter = error.response.data?.retryAfter || Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`Rate limited. Retrying after ${retryAfter}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        return this.generateResponse(messages, maxTokens, retryCount + 1);
      }
      
      // Handle server errors with retry
      if ((error.response?.status === 502 || error.response?.status === 503) && retryCount < 2) {
        const retryAfter = Math.pow(2, retryCount) * 2000; // 2s, 4s
        console.log(`Server error. Retrying after ${retryAfter}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        return this.generateResponse(messages, maxTokens, retryCount + 1);
      }
      
      // Handle timeout errors
      if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
        const timeoutError = new Error('AI service request timeout. Please try again.');
        timeoutError.code = 'AI_TIMEOUT';
        timeoutError.statusCode = 408;
        timeoutError.retryable = true;
        throw timeoutError;
      }
      
      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        const networkError = new Error('AI service is temporarily unavailable. Please try again later.');
        networkError.code = 'AI_SERVICE_UNAVAILABLE';
        networkError.statusCode = 503;
        networkError.retryable = true;
        throw networkError;
      }
      
      // Create specific error messages based on status
      if (error.response?.status === 429) {
        const rateLimitError = new Error('AI service rate limit exceeded. Please wait a moment before trying again.');
        rateLimitError.code = 'AI_RATE_LIMIT';
        rateLimitError.statusCode = 429;
        rateLimitError.retryable = true;
        rateLimitError.retryAfter = error.response.data?.retryAfter || 30;
        throw rateLimitError;
      }
      
      if (error.response?.status === 502 || error.response?.status === 503) {
        const serviceError = new Error('AI service is temporarily unavailable. Please try again later.');
        serviceError.code = 'AI_SERVICE_DOWN';
        serviceError.statusCode = 503;
        serviceError.retryable = true;
        throw serviceError;
      }

      if (error.response?.status === 401) {
        const authError = new Error('AI service authentication failed. Please contact support.');
        authError.code = 'AI_AUTH_ERROR';
        authError.statusCode = 500;
        throw authError;
      }

      if (error.response?.status === 400) {
        const badRequestError = new Error('Invalid request to AI service. Please try again.');
        badRequestError.code = 'AI_BAD_REQUEST';
        badRequestError.statusCode = 400;
        throw badRequestError;
      }
      
      // Default error
      const defaultError = new Error('Failed to generate AI response. Please try again.');
      defaultError.code = 'AI_GENERATION_FAILED';
      defaultError.statusCode = 500;
      defaultError.retryable = true;
      throw defaultError;
    }
  }

  // AI Tutor specific response generation
  async generateTutorResponse(userMessage, context) {
    // Use mock service for testing if enabled
    // if (this.shouldUseMockService()) {
      // console.log('🤖 Using Mock AI Service for testing');
      // return await MockAIService.generateTutorResponse(userMessage, context);
    // }

    const systemPrompt = this.buildSystemPrompt(context);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    return await this.generateResponse(messages, 300);
  }

  // Theory explanation
  async explainTheory(topic, userLevel, userGoal) {
    const systemPrompt = `You are an AI tutor helping users learn about "${topic}" in the context of their goal: "${userGoal}". 
    The user's level is ${userLevel}. Provide a clear, engaging explanation with examples relevant to their specific goal.
    Keep the explanation concise but comprehensive (under 500 words).`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Explain ${topic} in a way that helps me achieve my goal: ${userGoal}` }
    ];

    return await this.generateResponse(messages, 1000);
  }

  // Practice problem generation
  async generatePracticeProblems(module, userProgress) {
    // Use mock service for testing if enabled
    // if (this.shouldUseMockService()) {
    //   console.log('🤖 Using Mock AI Service for practice problems');
    //   return await MockAIService.generatePracticeProblems(module, userProgress);
    // }

    const systemPrompt = `Generate 3 practice problems for the learning module: "${module.title}". 
    User's current progress: ${userProgress}%. 
    Make problems relevant to their goal: "${module.relatedGoal || 'general learning'}". 
    Format as JSON with this structure:
    {
      "problems": [
        {
          "id": 1,
          "question": "Problem text",
          "difficulty": "easy",
          "hints": ["hint1", "hint2"],
          "solution": "Step-by-step solution"
        }
      ]
    }`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate practice problems for me to solve.' }
    ];

    return await this.generateResponse(messages, 1200);
  }

  // Quick Q&A responses
  async generateQuickResponse(userMessage) {
    // Use mock service for testing if enabled
    // if (this.shouldUseMockService()) {
    //   console.log('🤖 Using Mock AI Service for quick response');
    //   return await MockAIService.generateQuickResponse(userMessage);
    // }

    const systemPrompt = `You are a helpful AI tutor. Provide concise, helpful responses to user questions. 
    Be encouraging and educational. Keep responses under 200 words.`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    return await this.generateResponse(messages, 300);
  }

  // Learning path recommendation
  async recommendNextSteps(userProgress, goals) {
    const systemPrompt = `Based on the user's progress and goals, recommend the next learning steps. 
    Be specific and actionable. Format as a simple list with 3-5 items.`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `My progress: ${JSON.stringify(userProgress)}. My goals: ${JSON.stringify(goals)}` }
    ];

    return await this.generateResponse(messages, 500);
  }

  // Build system prompt for AI Tutor
  buildSystemPrompt(context) {
    return `You are an AI Avatar Tutor for Goal Achiever, a goal-tracking platform. 
    
    User Context:
    - Current Goal: ${context.goal?.title || 'Not specified'}
    - Goal Category: ${context.goal?.category || 'General'}
    - Learning Level: ${context.userLevel || 'Beginner'}
    - Current Learning Module: ${context.activeModule?.title || 'None'}
    
    Your Role:
    1. Provide personalized, encouraging responses
    2. Explain concepts in relation to their specific goals
    3. Use examples relevant to their goal category
    4. Adapt your teaching style to their level
    5. Be conversational and supportive
    6. Ask clarifying questions when needed
    
    Guidelines:
    - Keep responses concise but informative (under 300 words)
    - Use analogies related to their goal
    - Provide actionable advice
    - Encourage progress and celebrate small wins
    - If they're stuck, offer hints rather than direct answers
    - Always be positive and motivating
    - Use simple, clear language
    - End responses with a question to keep the conversation flowing`;
  }

  // Generate avatar responses (for video simulation)
  async generateAvatarResponse(userMessage, context) {
    const systemPrompt = `You are an AI Avatar Tutor. Respond as if you're speaking directly to the user in a video call.
    Be more conversational and use phrases like "I can see you're working on..." or "Let me help you with that..."
    Keep responses under 200 words and make them feel like a real conversation.`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    return await this.generateResponse(messages, 400);
  }
}

module.exports = new OpenRouterService();
