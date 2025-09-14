const axios = require('axios');

const testBackendConnection = async () => {
  try {
    console.log('🧪 Testing Backend Connection...\n');
    
    // Test health endpoint
    const response = await axios.get('http://localhost:5000/api/health');
    
    console.log('✅ Backend is running!');
    console.log('📊 Response Status:', response.status);
    console.log('📝 Response Data:', JSON.stringify(response.data, null, 2));
    
    // Test CORS
    console.log('\n🌐 Testing CORS...');
    const corsResponse = await axios.get('http://localhost:5000/api/health', {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    console.log('✅ CORS is working!');
    console.log('📊 CORS Headers:', corsResponse.headers);
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure your backend server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
};

testBackendConnection();
