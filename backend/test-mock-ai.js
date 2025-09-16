const OpenRouterService = require('./src/services/openRouterService');
require('dotenv').config();

async function testMockAI() {
  console.log('🧪 Testing Mock AI Service...\n');
  
  // Enable mock AI service
  process.env.USE_MOCK_AI = 'true';
  
  try {
    // Test quick response
    console.log('⚡ Testing quick response...');
    const quickResponse = await OpenRouterService.generateQuickResponse("How do I set a good goal?");
    console.log('✅ Quick response received:');
    console.log(`Content: ${quickResponse.content}`);
    console.log(`Model: ${quickResponse.model}\n`);

    // Test tutor response
    console.log('🤖 Testing tutor response...');
    const context = {
      goal: { title: "Learn React", category: "learning" },
      userLevel: "beginner",
      activeModule: null
    };
    const tutorResponse = await OpenRouterService.generateTutorResponse("I want to learn React but don't know where to start", context);
    console.log('✅ Tutor response received:');
    console.log(`Content: ${tutorResponse.content}`);
    console.log(`Model: ${tutorResponse.model}\n`);

    // Test practice problems
    console.log('📚 Testing practice problems...');
    const module = {
      title: "Goal Setting Fundamentals",
      relatedGoal: "Learn effective goal setting techniques"
    };
    const practiceProblems = await OpenRouterService.generatePracticeProblems(module, 25);
    console.log('✅ Practice problems generated:');
    console.log(`Content: ${practiceProblems.content}\n`);

    console.log('🎉 All mock AI tests passed! You can now test your AI tutor without rate limits!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMockAI();
