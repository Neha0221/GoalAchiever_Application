const axios = require('axios');

// Test goal creation endpoint
async function testGoalCreation() {
  try {
    console.log('Testing goal creation endpoint...');
    
    // First, let's try to login to get a token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com', // Replace with a valid test user
      password: 'password123'    // Replace with valid password
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Now test goal creation
    const goalData = {
      title: 'Test Goal',
      description: 'This is a test goal to verify the creation endpoint',
      category: 'learning',
      complexity: 'beginner',
      priority: 'medium',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      suggestedTimeline: '3months',
      tags: ['test', 'debugging'],
      isPublic: false
    };
    
    console.log('Creating goal with data:', goalData);
    
    const createResponse = await axios.post('http://localhost:5000/api/goals', goalData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Goal creation response:', createResponse.data);
    
    // Test fetching goals
    const fetchResponse = await axios.get('http://localhost:5000/api/goals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Goals fetch response:', fetchResponse.data);
    console.log('Number of goals:', fetchResponse.data.data?.length || 0);
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testGoalCreation();
