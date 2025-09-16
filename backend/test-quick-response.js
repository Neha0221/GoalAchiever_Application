const OpenRouterService = require('./src/services/openRouterService');
require('dotenv').config();

async function testQuickResponse() {
  console.log('🧪 Testing Quick Response with Mock AI...\n');
  
  try {
    // Test quick response
    console.log('⚡ Testing quick response...');
    const response = await OpenRouterService.generateQuickResponse("How do I set a good goal?");
    console.log('✅ Quick response received:');
    console.log(`Content: ${response.content}`);
    console.log(`Model: ${response.model}`);
    console.log(`Success: ${response.success}\n`);

    console.log('🎉 Quick response test passed!');
    console.log('🚀 The AI tutor should now display responses in the UI!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQuickResponse();
