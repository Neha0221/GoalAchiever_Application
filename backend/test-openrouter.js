const OpenRouterService = require('./src/services/openRouterService');
require('dotenv').config();

async function testOpenRouter() {
  console.log('🧪 Testing OpenRouter Integration...\n');
  
  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`API Key: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`API Key (first 20 chars): ${process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 20) + '...' : 'Not set'}`);
  console.log(`Model: ${process.env.OPENAI_MODEL || 'openai/gpt-oss-20b:free'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set in environment variables');
    return;
  }

  try {
    // Test basic response
    console.log('🤖 Testing basic AI response...');
    const testMessage = "Hello! Can you help me with goal setting?";
    const context = {
      goal: { title: "Learn React", category: "learning" },
      userLevel: "beginner",
      activeModule: null
    };

    const response = await OpenRouterService.generateTutorResponse(testMessage, context);
    
    console.log('✅ AI Response received:');
    console.log(`Model: ${response.model}`);
    console.log(`Content: ${response.content}`);
    console.log(`Usage: ${JSON.stringify(response.usage, null, 2)}\n`);

    // Test quick response
    console.log('⚡ Testing quick response...');
    const quickResponse = await OpenRouterService.generateQuickResponse("What is the best way to stay motivated?");
    
    console.log('✅ Quick response received:');
    console.log(`Content: ${quickResponse.content}\n`);

    // Test practice problems
    console.log('📚 Testing practice problem generation...');
    const module = {
      title: "Goal Setting Fundamentals",
      relatedGoal: "Learn effective goal setting techniques"
    };
    
    const practiceProblems = await OpenRouterService.generatePracticeProblems(module, 25);
    
    console.log('✅ Practice problems generated:');
    console.log(`Content: ${practiceProblems.content}\n`);

    console.log('🎉 All tests passed! OpenRouter integration is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testOpenRouter();
