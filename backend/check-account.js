const axios = require('axios');
require('dotenv').config();

async function checkAccount() {
  try {
    console.log('🔍 Checking OpenRouter Account Status...\n');
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      return;
    }

    console.log(`API Key (first 20 chars): ${apiKey.substring(0, 20)}...`);

    const response = await axios.get('https://openrouter.ai/api/v1/key', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Account Status:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Error checking account:', error.response?.data || error.message);
  }
}

checkAccount();
