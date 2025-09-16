const { v4: uuidv4 } = require('uuid');

class MockAIService {
  constructor() {
    this.responses = [
      "I'd be happy to help you with that! Let me break this down into manageable steps.",
      "That's a great question! Here's how you can approach this goal effectively.",
      "I can see you're working on something important. Let me provide some guidance.",
      "Excellent progress! Here are some strategies to help you move forward.",
      "I understand your challenge. Let me share some insights that might help.",
      "That's a thoughtful approach! Here are some additional considerations.",
      "Great question! Let me explain this concept in a way that relates to your goals.",
      "I can help you with that! Here's a step-by-step approach you can follow.",
      "Wonderful! I'm here to support your learning journey. Let me provide some guidance.",
      "That's an interesting challenge! Here are some strategies to consider."
    ];
    
    this.practiceProblems = [
      {
        id: 1,
        question: "What is the first step in setting a SMART goal?",
        difficulty: "easy",
        hints: ["Think about what makes a goal specific", "Consider what you want to achieve"],
        solution: "The first step is to make your goal Specific - clearly define what you want to accomplish."
      },
      {
        id: 2,
        question: "How do you measure progress toward your goal?",
        difficulty: "medium",
        hints: ["Think about quantifiable metrics", "Consider milestones"],
        solution: "Set measurable criteria and track your progress using specific metrics and milestones."
      },
      {
        id: 3,
        question: "What makes a goal achievable?",
        difficulty: "medium",
        hints: ["Consider your resources", "Think about realistic timelines"],
        solution: "A goal is achievable when it's realistic given your current resources, skills, and time constraints."
      }
    ];
  }

  // Simulate API delay
  async delay(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock response generation
  async generateResponse(messages, maxTokens = 1000) {
    await this.delay(800 + Math.random() * 1200); // 0.8-2 second delay
    
    const randomResponse = this.responses[Math.floor(Math.random() * this.responses.length)];
    const userMessage = messages.find(m => m.role === 'user')?.content || "Hello";
    
    // Generate contextual response based on user message
    let response = randomResponse;
    if (userMessage.toLowerCase().includes('goal')) {
      response = "I can help you set and achieve your goals! Start by making them SMART: Specific, Measurable, Achievable, Relevant, and Time-bound.";
    } else if (userMessage.toLowerCase().includes('help')) {
      response = "I'm here to help you succeed! I can assist with goal setting, learning strategies, and providing motivation. What would you like to work on?";
    } else if (userMessage.toLowerCase().includes('learn')) {
      response = "Learning is a journey! Break down complex topics into smaller chunks, practice regularly, and don't be afraid to make mistakes - they're part of the process.";
    }

    return {
      content: response,
      model: 'mock-ai-service',
      usage: {
        prompt_tokens: Math.floor(Math.random() * 50) + 20,
        completion_tokens: Math.floor(Math.random() * 100) + 30,
        total_tokens: Math.floor(Math.random() * 150) + 50
      },
      success: true
    };
  }

  // Mock tutor response
  async generateTutorResponse(userMessage, context) {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];
    return await this.generateResponse(messages, 800);
  }

  // Mock quick response
  async generateQuickResponse(userMessage) {
    const systemPrompt = "You are a helpful AI tutor. Provide concise, helpful responses to user questions. Be encouraging and educational. Keep responses under 200 words.";
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];
    return await this.generateResponse(messages, 300);
  }

  // Mock practice problems
  async generatePracticeProblems(module, userProgress) {
    await this.delay(1500);
    
    const problems = this.practiceProblems.slice(0, 3);
    return {
      content: JSON.stringify({ problems }),
      model: 'mock-ai-service',
      usage: { total_tokens: 200 },
      success: true
    };
  }

  // Mock recommendations
  async recommendNextSteps(userProgress, goals) {
    await this.delay(1000);
    
    const recommendations = [
      "Review your current goals and identify any that need adjustment",
      "Break down large goals into smaller, actionable steps",
      "Set up a daily routine to work on your goals",
      "Track your progress regularly and celebrate small wins",
      "Seek feedback from mentors or peers on your approach"
    ];
    
    return {
      content: recommendations.join('\n'),
      model: 'mock-ai-service',
      usage: { total_tokens: 150 },
      success: true
    };
  }

  // Build system prompt
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
}

module.exports = new MockAIService();
